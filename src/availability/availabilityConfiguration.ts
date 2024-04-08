import { getDB, injectDatabaseContext } from '#storage';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ResourceAvailabilityReadModel } from '.';
import { UtilsConfiguration } from '../utils';
import { AvailabilityFacade } from './availabilityFacade';
import { ResourceAvailabilityRepository } from './resourceAvailabilityRepository';

export class AvailabilityConfiguration {
  constructor(
    public readonly connectionString: string,
    private readonly utilsConfiguration: UtilsConfiguration = new UtilsConfiguration(),
  ) {}

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
      new AvailabilityFacade(
        repository,
        readModel,
        this.utilsConfiguration.eventsPublisher,
        this.utilsConfiguration.clock,
      ),
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
