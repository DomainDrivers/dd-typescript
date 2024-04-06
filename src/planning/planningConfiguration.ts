import { getDB, injectTransactionContext } from '#storage';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AvailabilityConfiguration } from '../availability';
import { StageParallelization } from './parallelization';
import { PlanChosenResources } from './planChosenResources';
import { PlanningFacade } from './planningFacade';
import {
  DrizzleProjectRepository,
  type ProjectRepository,
} from './projectRepository';
import * as schema from './schema';

export class PlanningConfiguration {
  constructor(
    public readonly connectionString: string,
    private readonly enableLogging: boolean = false,
  ) {
    console.log('connectionstring: ' + this.connectionString);
  }

  public static readonly schema = schema;

  public planningFacade = (
    projectRepository?: ProjectRepository,
    planChosenResourcesService?: PlanChosenResources,
    getDatabase?: () => NodePgDatabase<typeof schema>,
  ) => {
    const repository = projectRepository ?? this.projectRepository();
    const getDB = getDatabase ?? (() => this.db());

    return injectTransactionContext(
      new PlanningFacade(
        repository,
        new StageParallelization(),
        planChosenResourcesService ??
          injectTransactionContext(
            this.planChosenResourcesService(repository),
            getDB,
          ),
      ),
      getDB,
    );
  };

  public planChosenResourcesService = (projectRepository?: ProjectRepository) =>
    new PlanChosenResources(
      projectRepository ?? this.projectRepository(),
      new AvailabilityConfiguration(
        this.connectionString,
        this.enableLogging,
      ).availabilityFacade(),
    );

  public projectRepository = (): ProjectRepository =>
    new DrizzleProjectRepository();

  public db = (cs?: string): NodePgDatabase<typeof schema> =>
    getDB(cs ?? this.connectionString, { schema, logger: this.enableLogging });
}
