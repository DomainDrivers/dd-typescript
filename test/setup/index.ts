import { endPool, getDB } from '#storage';
import {
  UtilsConfiguration,
  deepEquals,
  getTransactionAwareEventBus,
  isEventOfType,
  type Event,
  type EventDataOf,
  type EventHandler,
  type EventTypeOf,
  type OptionalEventMetaData,
  type TransactionAwareEventBus,
} from '#utils';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { sql, type DrizzleConfig } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { assertThatArray } from '../asserts';

let postgreSQLContainer: StartedPostgreSqlContainer | null = null;
let startedCount = 0;

type EventBusWrapper = TransactionAwareEventBus & {
  verifyPublishedEvent: <EventType extends Event>(
    type: EventTypeOf<EventType>,
    data: Omit<EventDataOf<EventType>, 'eventId' | 'occurredAt'> &
      OptionalEventMetaData,
  ) => void;

  verifyPublishedEventThatMatches: <EventType extends Event>(
    type: EventTypeOf<EventType>,
    matches: (event: EventType) => boolean,
  ) => void;

  clearPublishedHistory: () => void;
};

export interface TestConfiguration {
  eventBus: EventBusWrapper;
  utilsConfiguration: UtilsConfiguration;
  start: <TSchema extends Record<string, unknown> = Record<string, never>>(
    config: DrizzleConfig<TSchema>,
  ) => Promise<string>;
  stop: () => Promise<void>;
  clearTestData: () => Promise<void> | void;
}

const wrapEventBusForTests = (
  eventBus: TransactionAwareEventBus,
): EventBusWrapper => {
  let publishedEvents: Event[] = [];

  return {
    publish: async <EventType extends Event = Event>(
      event: EventType,
    ): Promise<void> => {
      await eventBus.publish(event);
      publishedEvents.push(event);
    },
    enlist: (tx) => eventBus.enlist(tx),

    commit: () => eventBus.commit(),

    subscribe: <EventType extends Event>(
      eventTypes: EventTypeOf<EventType>[],
      eventHandler: EventHandler<EventType>,
    ): void => eventBus.subscribe(eventTypes, eventHandler),

    verifyPublishedEvent: <EventType extends Event>(
      type: EventTypeOf<EventType>,
      data: Omit<EventDataOf<EventType>, 'eventId' | 'occurredAt'> &
        OptionalEventMetaData,
    ): void =>
      assertThatArray(publishedEvents).anyMatches((published) => {
        const {
          eventId: expectedEventId,
          occurredAt: expectedOccurredAt,
          data: expectedData,
        } = data;
        const {
          eventId: actualEventId,
          occurredAt: actualOccurredAt,
          data: actualData,
        } = data;

        return (
          published.type === type &&
          deepEquals(expectedData, actualData) &&
          (expectedEventId
            ? expectedEventId === actualEventId
            : !actualEventId) &&
          (expectedOccurredAt
            ? expectedOccurredAt === actualOccurredAt
            : !actualOccurredAt)
        );
      }),

    verifyPublishedEventThatMatches: <EventType extends Event>(
      type: EventTypeOf<EventType>,
      matches: (event: EventType) => boolean,
    ) =>
      assertThatArray(publishedEvents).anyMatches(
        (published) =>
          isEventOfType<EventType>(type, published) && matches(published),
      ),

    clearPublishedHistory: () => (publishedEvents = []),
  };
};

export const TestConfiguration = (
  utilsConfiguration?: UtilsConfiguration,
  databaseName?: string,
  enableLogging: boolean = false,
): TestConfiguration => {
  let connectionString: string;
  const eventBusWrapper = wrapEventBusForTests(getTransactionAwareEventBus());
  utilsConfiguration =
    utilsConfiguration ?? new UtilsConfiguration(eventBusWrapper);
  let drizzleConfig: DrizzleConfig;

  return {
    eventBus: eventBusWrapper,
    utilsConfiguration: utilsConfiguration,
    start: async <
      TSchema extends Record<string, unknown> = Record<string, never>,
    >(
      config: DrizzleConfig<TSchema>,
    ): Promise<string> => {
      if (startedCount++ === 0 || postgreSQLContainer === null)
        postgreSQLContainer = await new PostgreSqlContainer(
          'postgres:15-alpine',
        )
          .withDatabase(databaseName ?? 'test')
          .start();

      connectionString = postgreSQLContainer.getConnectionUri();
      drizzleConfig = config as DrizzleConfig;

      if (enableLogging) console.log('connectionstring: ' + connectionString);

      const database = getDB<TSchema>(connectionString, config);

      await migrate(database, { migrationsFolder: './drizzle' });

      return connectionString;
    },
    stop: async (): Promise<void> => {
      if (postgreSQLContainer !== null && --startedCount === 0) {
        try {
          await endPool(connectionString);
        } finally {
          await postgreSQLContainer.stop();
          postgreSQLContainer = null;
        }
      }
    },

    clearTestData: async () => {
      eventBusWrapper.clearPublishedHistory();
      await clearDb(getDB(connectionString, drizzleConfig));
    },
  };
};

const clearDb = async <
  TSchema extends Record<string, unknown> = Record<string, never>,
>(
  db: NodePgDatabase<TSchema>,
): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const schema = (db as any).session.schema.schema as Record<string, any>;

  for (const property in schema) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const table = schema[property];

    const query = sql.raw(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      `TRUNCATE TABLE "${table.schema}"."${table.dbName}" CASCADE;`,
    );
    await db.execute(query);
  }
};
