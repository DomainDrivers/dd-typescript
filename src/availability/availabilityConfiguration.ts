import { getDB, injectDatabase } from '#storage';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ResourceAvailabilityReadModel } from '.';
import { UtilsConfiguration } from '../utils';
import { AvailabilityFacade } from './availabilityFacade';
import { ResourceAvailabilityRepository } from './resourceAvailabilityRepository';
import * as schema from './schema';

export class AvailabilityConfiguration {
  constructor(
    public readonly connectionString: string,
    private readonly utils: UtilsConfiguration = new UtilsConfiguration(),
  ) {}

  public availabilityFacade = (
    resourceAvailabilityRepository?: ResourceAvailabilityRepository,
    resourceAvailabilityReadModel?: ResourceAvailabilityReadModel,
    getDatabase?: () => NodePgDatabase<typeof schema>,
  ): AvailabilityFacade => {
    const getDB = getDatabase ?? (() => this.db());
    const repository =
      resourceAvailabilityRepository ?? this.resourceAvailabilityRepository();

    const readModel =
      resourceAvailabilityReadModel ?? this.resourceAvailabilityReadModel();

    return injectDatabase(
      new AvailabilityFacade(
        repository,
        readModel,
        this.utils.eventBus,
        this.utils.clock,
      ),
      getDB(),
      this.utils.eventBus.commit,
    );
  };

  public resourceAvailabilityRepository = (): ResourceAvailabilityRepository =>
    new ResourceAvailabilityRepository();

  public resourceAvailabilityReadModel = (): ResourceAvailabilityReadModel =>
    new ResourceAvailabilityReadModel();

  public db = (cs?: string): NodePgDatabase<typeof schema> =>
    getDB(cs ?? this.connectionString, { schema });
}
