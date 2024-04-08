import { getDB, injectDatabaseContext } from '#storage';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AvailabilityConfiguration } from '../availability';
import { UtilsConfiguration } from '../utils';
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
    private readonly utilsConfiguration: UtilsConfiguration = new UtilsConfiguration(),
    private readonly availabilityConfiguration: AvailabilityConfiguration = new AvailabilityConfiguration(
      connectionString,
      utilsConfiguration,
    ),
  ) {}

  public planningFacade = (
    projectRepository?: ProjectRepository,
    planChosenResources?: PlanChosenResources,
    getDatabase?: () => NodePgDatabase<typeof schema>,
  ) => {
    const repository = projectRepository ?? this.projectRepository();
    const getDB = getDatabase ?? this.db;

    return injectDatabaseContext(
      new PlanningFacade(
        repository,
        new StageParallelization(),
        planChosenResources ??
          injectDatabaseContext(
            this.planChosenResourcesService(repository),
            getDB,
          ),
        this.utilsConfiguration.eventBus,
        this.utilsConfiguration.clock,
      ),
      getDB,
    );
  };

  public planChosenResourcesService = (projectRepository?: ProjectRepository) =>
    new PlanChosenResources(
      projectRepository ?? this.projectRepository(),
      this.availabilityConfiguration.availabilityFacade(),
      this.utilsConfiguration.eventBus,
      this.utilsConfiguration.clock,
    );

  public projectRepository = (): ProjectRepository =>
    new DrizzleProjectRepository();

  public db = (cs?: string): NodePgDatabase<typeof schema> =>
    getDB(cs ?? this.connectionString, { schema });
}
