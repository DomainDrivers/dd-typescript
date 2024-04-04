import { PlanningConfiguration } from '#planning';
import { endPool } from '#storage';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

export interface PlannerTestEnvironment {
  start: () => Promise<PlanningConfiguration>;
  stop: () => Promise<void>;
}

let postgreSQLContainer: StartedPostgreSqlContainer | null = null;
let startedCount = 0;

export const PlannerTestEnvironment = (): PlannerTestEnvironment => {
  let configuration: PlanningConfiguration;

  return {
    start: async (): Promise<PlanningConfiguration> => {
      if (startedCount++ === 0 || postgreSQLContainer === null)
        postgreSQLContainer = await new PostgreSqlContainer().start();

      configuration = new PlanningConfiguration(
        postgreSQLContainer.getConnectionUri(),
      );

      const database = configuration.db();

      await migrate(database, { migrationsFolder: './drizzle' });

      return configuration;
    },
    stop: async (): Promise<void> => {
      if (postgreSQLContainer !== null && --startedCount === 0) {
        await endPool(configuration.connectionString);
        await postgreSQLContainer.stop();
      }
    },
  };
};
