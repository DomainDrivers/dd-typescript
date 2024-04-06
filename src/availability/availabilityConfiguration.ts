import { getDB, injectTransactionContext } from '#storage';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
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
    getDatabase?: () => NodePgDatabase,
  ): AvailabilityFacade => {
    const repository =
      resourceAvailabilityRepository ?? this.resourceAvailabilityRepository();
    const getDB = getDatabase ?? (() => this.db());

    return injectTransactionContext(new AvailabilityFacade(repository), getDB);
  };

  public resourceAvailabilityRepository = (): ResourceAvailabilityRepository =>
    new ResourceAvailabilityRepository();

  public db = (cs?: string): NodePgDatabase =>
    getDB(cs ?? this.connectionString);
}
