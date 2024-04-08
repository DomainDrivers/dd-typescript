import { endPool, getDB } from '#storage';
import {
  UtilsConfiguration,
  deepEquals,
  getInMemoryEventsBus,
  isEventOfType,
  type Event,
  type EventBus,
  type EventDataOf,
  type EventHandler,
  type EventTypeOf,
  type OptionalEventMetaData,
} from '#utils';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import type { DrizzleConfig } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { assertThatArray } from '../asserts';

let postgreSQLContainer: StartedPostgreSqlContainer | null = null;
let startedCount = 0;

type EventBusWrapper = EventBus & {
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

const wrapEventBusForTests = (eventBus: EventBus): EventBusWrapper => {
  let publishedEvents: Event[] = [];

  return {
    publish: async <EventType extends Event = Event>(
      event: EventType,
    ): Promise<void> => {
      await eventBus.publish(event);
      publishedEvents.push(event);
    },

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
  enableLogging: boolean = false,
): TestConfiguration => {
  let connectionString: string;
  const eventBusWrapper = wrapEventBusForTests(getInMemoryEventsBus());
  utilsConfiguration =
    utilsConfiguration ?? new UtilsConfiguration(eventBusWrapper);

  return {
    eventBus: eventBusWrapper,
    utilsConfiguration: utilsConfiguration,
    start: async <
      TSchema extends Record<string, unknown> = Record<string, never>,
    >(
      config?: DrizzleConfig<TSchema>,
    ): Promise<string> => {
      if (startedCount++ === 0 || postgreSQLContainer === null)
        postgreSQLContainer = await new PostgreSqlContainer(
          'postgres:15-alpine',
        ).start();

      connectionString = postgreSQLContainer.getConnectionUri();
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

    clearTestData: () => eventBusWrapper.clearPublishedHistory(),
  };
};
