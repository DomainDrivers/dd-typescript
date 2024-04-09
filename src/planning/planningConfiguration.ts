import { Redis } from 'ioredis';
import { AvailabilityConfiguration } from '../availability';
import { UtilsConfiguration } from '../utils';
import { StageParallelization } from './parallelization';
import { PlanChosenResources } from './planChosenResources';
import { PlanningFacade } from './planningFacade';
import {
  RedisProjectRepository,
  type ProjectRepository,
} from './projectRepository';
import { nulloTransactionContext } from '../storage';

export class PlanningConfiguration {
  constructor(
    private readonly redisConfiguration: RedisConfiguration,
    connectionString: string,
    private readonly utils: UtilsConfiguration = new UtilsConfiguration(),
    private readonly availabilityConfiguration: AvailabilityConfiguration = new AvailabilityConfiguration(
      connectionString,
      utils,
    ),
  ) {}

  public planningFacade = (
    projectRepository?: ProjectRepository,
    planChosenResources?: PlanChosenResources,
  ) => {
    const repository =
      projectRepository ?? this.redisConfiguration.projectRepository();

    return nulloTransactionContext(
      new PlanningFacade(
        repository,
        new StageParallelization(),
        planChosenResources ??
          nulloTransactionContext(
            this.planChosenResourcesService(repository),
            this.utils.eventBus.commit,
          ),
        this.utils.eventBus,
        this.utils.clock,
      ),
      this.utils.eventBus.commit,
    );
  };

  public planChosenResourcesService = (projectRepository?: ProjectRepository) =>
    new PlanChosenResources(
      projectRepository ?? this.redisConfiguration.projectRepository(),
      this.availabilityConfiguration.availabilityFacade(),
      this.utils.eventBus,
      this.utils.clock,
    );
}

export type RedisConfig = { host: string; port: number };

export class RedisConfiguration {
  constructor(private readonly redisClient: Redis) {}

  public projectRepository = (redisClient?: Redis): ProjectRepository =>
    new RedisProjectRepository(redisClient ?? this.redisClient);
}
