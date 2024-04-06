import { getDB, injectDatabaseContext } from '#storage';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ResourceAvailabilityReadModel } from '.';
import { AvailabilityFacade } from './availabilityFacade';
import { ResourceAvailabilityRepository } from './resourceAvailabilityRepository';

export class AvailabilityConfiguration {
  constructor(
    public readonly connectionString: string,
    private readonly enableLogging: boolean = false,
  ) {
    console.log('connectionstring: ' + this.connectionString);
  }

  public availabilityFacade = (
    resourceAvailabilityRepository?: ResourceAvailabilityRepository,
    resourceAvailabilityReadModel?: ResourceAvailabilityReadModel,
    getDatabase?: () => NodePgDatabase,
  ): AvailabilityFacade => {
    const getDB = getDatabase ?? (() => this.db());
    const repository =
      resourceAvailabilityRepository ?? this.resourceAvailabilityRepository();

    const readModel =
      resourceAvailabilityReadModel ?? this.resourceAvailabilityReadModel();

    return injectDatabaseContext(
      new AvailabilityFacade(repository, readModel),
      getDB,
    );
  };

  public resourceAvailabilityRepository = (): ResourceAvailabilityRepository =>
    new ResourceAvailabilityRepository();

  public resourceAvailabilityReadModel = (): ResourceAvailabilityReadModel =>
    new ResourceAvailabilityReadModel();

  public db = (cs?: string): NodePgDatabase =>
    getDB(cs ?? this.connectionString);
}
