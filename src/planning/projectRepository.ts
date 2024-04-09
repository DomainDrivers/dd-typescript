import { ResourceId } from '#availability';
import { Capability, TimeSlot } from '#shared';
import { type Repository } from '#storage';
import { ObjectMap, ObjectSet, UUID } from '#utils';
import { UTCDate } from '@date-fns/utc';
import { Redis } from 'ioredis';
import { ChosenResources } from './chosenResources';
import { Demand, Demands, DemandsPerStage } from './demands';
import { ParallelStagesList, Stage } from './parallelization';
import { ParallelStages } from './parallelization/parallelStages';
import { Project } from './project';
import { ProjectId } from './projectId';
import { Schedule } from './schedule';
import type {
  CapabilityEntity,
  ChosenResourcesEntity,
  DemandEntity,
  DemandsEntity,
  DemandsPerStageEntity,
  ParallelStagesListEntity,
  ProjectEntity,
  ScheduleEntity,
  StageEntity,
  TimeSlotEntity,
} from './schema';

export interface ProjectRepository extends Repository<Project, ProjectId> {
  findAllById(ids: ProjectId[]): Promise<Project[]>;
  findAll(): Promise<Project[]>;
}

export class RedisProjectRepository implements ProjectRepository {
  constructor(private readonly redis: Redis) {}

  public async findAllById(ids: ProjectId[]): Promise<Project[]> {
    const idsArray = ids.map((id) => id.toString());

    const projectsStrings = await this.redis.hmget('projects', ...idsArray);

    return projectsStrings
      .filter((project) => project !== null)
      .map((value) => mapToProject(JSON.parse(value!) as ProjectEntity));
  }

  public async findAll(): Promise<Project[]> {
    const values = await this.redis.hvals('projects');

    return values.map((value) =>
      mapToProject(JSON.parse(value) as ProjectEntity),
    );
  }

  public async getById(id: ProjectId): Promise<Project> {
    const entity = await this.findById(id);

    if (entity === null)
      throw new Error(`Entity with '${id?.toString()}' was not found!`);

    return entity;
  }

  public async existsById(id: ProjectId): Promise<boolean> {
    const result = await this.redis.hexists('projects', id.toString());

    return !!result;
  }

  public async findById(id: ProjectId): Promise<Project | null> {
    const value = await this.redis.hget('projects', id.toString());

    if (!value) return null;

    return mapToProject(JSON.parse(value) as ProjectEntity);
  }

  public async save(project: Project): Promise<void> {
    await this.redis.hset(
      'projects',
      project.getId().toString(),
      JSON.stringify(mapFromProject(project)),
    );
  }
}

const mapToProject = (entity: ProjectEntity): Project =>
  new Project(
    entity.name,
    mapToParallelizedStagesList(entity.parallelizedStages),
    mapToDemandsPerStage(entity.demandsPerStage),
    mapToDemands(entity.allDemands),
    mapToSchedule(entity.schedule),
    mapToChosenResources(entity.chosenResources),
    entity.version,
    ProjectId.from(entity.id as UUID),
  );

const mapToParallelizedStagesList = (
  parallelizedStages: ParallelStagesListEntity | null,
): ParallelStagesList => {
  return new ParallelStagesList(
    (parallelizedStages?.all ?? []).map(
      (ps) => new ParallelStages(ObjectSet.from(ps.stages.map(mapToStage))),
    ),
  );
};

const mapToDemands = (demands: DemandsEntity | null): Demands =>
  new Demands(demands ? demands.all.map(mapToDemand) : []);

const mapToChosenResources = (
  chosenResources: ChosenResourcesEntity | null,
): ChosenResources =>
  new ChosenResources(
    chosenResources
      ? ObjectSet.from(chosenResources.resources.map(mapToResourceId))
      : ObjectSet.empty<ResourceId>(),
    chosenResources
      ? mapToTimeSlot(chosenResources.timeSlot)
      : TimeSlot.empty(),
  );

const mapToDemandsPerStage = (
  demandsPerStage: DemandsPerStageEntity | null,
): DemandsPerStage =>
  new DemandsPerStage(
    demandsPerStage?.demands && Object.keys(demandsPerStage?.demands).length > 0
      ? ObjectMap.from(
          [...demandsPerStage.demands].map(({ key, value }) => [
            key,
            mapToDemands(value),
          ]),
        )
      : ObjectMap.empty<string, Demands>(),
  );

const mapToSchedule = (schedule: ScheduleEntity | null): Schedule =>
  new Schedule(
    schedule && Object.keys(schedule.dates).length > 0
      ? ObjectMap.from(
          [...schedule.dates].map(({ key, value }) => [
            key,
            mapToTimeSlot(value),
          ]),
        )
      : ObjectMap.empty<string, TimeSlot>(),
  );

const mapToStage = ({
  stageName,
  dependencies,
  resources,
  duration,
}: StageEntity): Stage =>
  new Stage(
    stageName,
    ObjectSet.from(dependencies.map(mapToStage)),
    ObjectSet.from(resources.map(mapToResourceId)),
    duration,
  );

const mapToDemand = ({ capability }: DemandEntity): Demand =>
  new Demand(mapToCapability(capability));

const mapToTimeSlot = ({ from, to }: TimeSlotEntity): TimeSlot =>
  new TimeSlot(new UTCDate(from), new UTCDate(to));

const mapToCapability = ({ name, type }: CapabilityEntity): Capability =>
  new Capability(name, type);

const mapToResourceId = (id: string): ResourceId =>
  ResourceId.from(UUID.from(id));

const mapFromProject = (project: Project): ProjectEntity => {
  return {
    id: project.getId(),
    name: project.getName(),
    version: project.getVersion(),
    parallelizedStages: mapFromParallelizedStagesList(
      project.getParallelizedStages(),
    ),
    allDemands: mapFromDemands(project.getAllDemands()),
    chosenResources: mapFromChosenResources(project.getChosenResources()),
    demandsPerStage: mapFromDemandsPerStage(project.getDemandsPerStage()),
    schedule: mapFromSchedule(project.getSchedule()),
  };
};

const mapFromParallelizedStagesList = (
  parallelisedStages: ParallelStagesList,
): ParallelStagesListEntity => {
  return {
    all: parallelisedStages.all.map((ps: ParallelStages) => {
      return { stages: ps.stages.map(mapFromStage) };
    }),
  };
};

const mapFromDemands = (demands: Demands): DemandsEntity => {
  return {
    all: demands.all.map(mapFromDemand),
  };
};

const mapFromChosenResources = (
  chosenResources: ChosenResources,
): ChosenResourcesEntity => {
  return {
    resources: chosenResources.resources.map(mapFromResourceId),
    timeSlot: mapFromTimeSlot(chosenResources.timeSlot),
  };
};

const mapFromDemandsPerStage = (
  demandsPerStage: DemandsPerStage,
): DemandsPerStageEntity => {
  return {
    demands: demandsPerStage.demands.map(({ key, value }) => {
      return { key, value: mapFromDemands(value) };
    }),
  };
};

const mapFromSchedule = (schedule: Schedule): ScheduleEntity => {
  return {
    dates: schedule.dates.map(({ key, value }) => {
      return { key, value: mapFromTimeSlot(value) };
    }),
  };
};

const mapFromStage = (stage: Stage): StageEntity => {
  return {
    stageName: stage.name,
    dependencies: stage.dependencies.map(mapFromStage),
    resources: stage.resources.map(mapFromResourceId),
    duration: stage.duration,
  };
};

const mapFromDemand = (demand: Demand): DemandEntity => {
  return {
    capability: mapFromCapability(demand.capability),
  };
};

const mapFromTimeSlot = (timeSlot: TimeSlot): TimeSlotEntity => {
  return { from: timeSlot.from.toJSON(), to: timeSlot.to.toJSON() };
};

const mapFromCapability = (capability: Capability): CapabilityEntity => {
  return {
    name: capability.name,
    type: capability.type,
  };
};

const mapFromResourceId = (resource: ResourceId): string => resource;
