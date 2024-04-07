import { AvailabilityConfiguration } from '#availability';
import { getDB, injectDatabaseContext } from '#storage';
import { Clock } from '#utils';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AllocationFacade, CapabilityPlanningConfiguration } from '.';
import {
  DrizzleProjectAllocationsRepository,
  type ProjectAllocationsRepository,
} from './projectAllocationsRepository';
import * as schema from './schema';

export class AllocationConfiguration {
  constructor(
    public readonly connectionString: string,
    private readonly enableLogging: boolean = false,
  ) {
    console.log('connectionstring: ' + this.connectionString);
  }

  public allocationFacade = (
    clock: Clock = Clock,
    projectAllocationsRepository?: ProjectAllocationsRepository,
    getDatabase?: () => NodePgDatabase<typeof schema>,
  ) => {
    const repository =
      projectAllocationsRepository ?? this.projectAllocationsRepository();
    const getDB = getDatabase ?? (() => this.db());

    return injectDatabaseContext(
      new AllocationFacade(
        repository,
        new AvailabilityConfiguration(
          this.connectionString,
          this.enableLogging,
        ).availabilityFacade(),
        new CapabilityPlanningConfiguration(
          this.connectionString,
          this.enableLogging,
        ).capabilityFinder(),
        clock,
      ),
      getDB,
    );
  };

  public projectAllocationsRepository = (): ProjectAllocationsRepository =>
    new DrizzleProjectAllocationsRepository();

  public db = (cs?: string): NodePgDatabase<typeof schema> =>
    getDB(cs ?? this.connectionString, { schema, logger: this.enableLogging });
}
