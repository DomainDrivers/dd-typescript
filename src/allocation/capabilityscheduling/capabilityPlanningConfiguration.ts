import { AvailabilityConfiguration, AvailabilityFacade } from '#availability';
import { getDB, injectDatabaseContext } from '#storage';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  DrizzleAllocatableCapabilityRepository,
  type AllocatableCapabilityRepository,
} from './allocatableCapabilityRepository';
import { CapabilityFinder } from './capabilityFinder';
import { CapabilityScheduler } from './capabilityScheduler';
import * as schema from './schema';

export class CapabilityPlanningConfiguration {
  constructor(
    public readonly connectionString: string,
    private readonly enableLogging: boolean = false,
  ) {
    console.log('connectionstring: ' + this.connectionString);
  }

  public capabilityFinder = (
    availabilityFacade?: AvailabilityFacade,
    allocatableResourceRepository?: AllocatableCapabilityRepository,
    getDatabase?: () => NodePgDatabase<typeof schema>,
  ): CapabilityFinder => {
    const repository =
      allocatableResourceRepository ?? this.allocatableResourceRepository();
    const getDB = getDatabase ?? (() => this.db());

    return injectDatabaseContext(
      new CapabilityFinder(
        availabilityFacade ?? this.availabilityFacade(),
        repository,
      ),
      getDB,
    );
  };

  public capabilityScheduler = (
    availabilityFacade?: AvailabilityFacade,
    allocatableResourceRepository?: AllocatableCapabilityRepository,
    getDatabase?: () => NodePgDatabase<typeof schema>,
  ): CapabilityScheduler => {
    const repository =
      allocatableResourceRepository ?? this.allocatableResourceRepository();
    const getDB = getDatabase ?? (() => this.db());

    return injectDatabaseContext(
      new CapabilityScheduler(
        availabilityFacade ?? this.availabilityFacade(),
        repository,
      ),
      getDB,
    );
  };

  public availabilityFacade = () =>
    new AvailabilityConfiguration(
      this.connectionString,
      this.enableLogging,
    ).availabilityFacade();

  public allocatableResourceRepository = (): AllocatableCapabilityRepository =>
    new DrizzleAllocatableCapabilityRepository();

  public db = (cs?: string): NodePgDatabase<typeof schema> =>
    getDB(cs ?? this.connectionString, { schema, logger: this.enableLogging });
}