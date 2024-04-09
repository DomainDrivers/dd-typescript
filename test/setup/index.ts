import { endPool, getDB } from '#storage';
import { UtilsConfiguration, getTransactionAwareEventBus } from '#utils';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { sql, type DrizzleConfig } from 'drizzle-orm';
import { type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type Redis from 'ioredis';
import { wrapEventBusForTests, type EventBusWrapper } from './eventBusWrapper';
import {
  StartedRedisContainer,
  getRedisTestContainer,
  stopRedisTestContainer,
} from './redisTestContainer';

let postgreSQLContainer: StartedPostgreSqlContainer | null = null;
let startedPostgresCount = 0;

export interface TestConfiguration {
  eventBus: EventBusWrapper;
  utilsConfiguration: UtilsConfiguration;
  start: <TSchema extends Record<string, unknown> = Record<string, never>>(
    config: DrizzleConfig<TSchema>,
    startRedis?: boolean,
  ) => Promise<{
    connectionString: string;
    redisClient: Redis | undefined;
  }>;
  stop: () => Promise<void>;
  clearTestData: () => Promise<void> | void;
}

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
  let redisClient: Redis | undefined;
  let redisContainer: StartedRedisContainer | undefined;

  return {
    eventBus: eventBusWrapper,
    utilsConfiguration: utilsConfiguration,
    start: async <
      TSchema extends Record<string, unknown> = Record<string, never>,
    >(
      config: DrizzleConfig<TSchema>,
      startRedis: boolean = false,
    ): Promise<{
      connectionString: string;
      redisClient: Redis | undefined;
    }> => {
      if (startedPostgresCount++ === 0 || postgreSQLContainer === null)
        postgreSQLContainer = await new PostgreSqlContainer(
          'postgres:15-alpine',
        )
          .withDatabase(databaseName ?? 'test')
          .start();

      if (startRedis) {
        redisContainer = await getRedisTestContainer();
        redisClient = redisContainer.getClient();
      }

      connectionString = postgreSQLContainer.getConnectionUri();
      drizzleConfig = config as DrizzleConfig;

      if (enableLogging) console.log('connectionstring: ' + connectionString);

      const database = getDB<TSchema>(connectionString, config);

      await migrate(database, { migrationsFolder: './drizzle' });

      return { connectionString, redisClient };
    },
    stop: async (): Promise<void> => {
      if (postgreSQLContainer !== null && --startedPostgresCount === 0) {
        try {
          await endPool(connectionString);
        } finally {
          await postgreSQLContainer.stop();
          postgreSQLContainer = null;
        }
      }
      await stopRedisTestContainer();
    },

    clearTestData: async () => {
      eventBusWrapper.clearPublishedHistory();
      await clearDb(getDB(connectionString, drizzleConfig));
      if (redisClient) await redisClient.flushdb();
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
