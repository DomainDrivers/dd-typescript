import { ResourceId } from '#availability';
import { Capability, TimeSlot } from '#shared';
import { DrizzleRepository, type Repository } from '#storage';
import { ObjectMap, ObjectSet, UUID } from '#utils';
import { UTCDate } from '@date-fns/utc';
import { eq, inArray } from 'drizzle-orm';
import { ChosenResources } from './chosenResources';
import { Demand, Demands, DemandsPerStage } from './demands';
import { ParallelStagesList, Stage } from './parallelization';
import { ParallelStages } from './parallelization/parallelStages';
import { Project } from './project';
import { ProjectId } from './projectId';
import { Schedule } from './schedule';
import * as schema from './schema';

export interface ProjectRepository extends Repository<Project, ProjectId> {}

export class DrizzleProjectRepository extends DrizzleRepository<
  Project,
  ProjectId,
  typeof schema
> {
  constructor() {
    super(schema.projects, schema.projects.id, schema.projects.version);
  }

  public findById = async (id: ProjectId): Promise<Project | null> => {
    const result = await this.db.query.projects.findFirst({
      where: eq(schema.projects.id, id),
    });

    return result ? mapToProject(result) : null;
  };
  public findAllById = async (ids: ProjectId[]): Promise<Project[]> => {
    const result = await this.db
      .select()
      .from(schema.projects)
      .where(inArray(schema.projects.id, ids));

    return result.map(mapToProject);
  };
  public save = async (project: Project): Promise<void> => {
    const entity = mapFromProject(project);
    const { id: _id, ...toUpdate } = entity;

    return this.upsert(entity, toUpdate, {
      id: project.getId(),
      version: entity.version,
    });
  };
}

const mapToProject = (entity: typeof schema.projects.$inferSelect): Project =>
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
  parallelizedStages: schema.ParallelStagesListEntity | null,
): ParallelStagesList => {
  return new ParallelStagesList(
    (parallelizedStages?.all ?? []).map(
      (ps) => new ParallelStages(ObjectSet.from(ps.stages.map(mapToStage))),
    ),
  );
};

const mapToDemands = (demands: schema.DemandsEntity | null): Demands =>
  new Demands(demands ? demands.all.map(mapToDemand) : []);

const mapToChosenResources = (
  chosenResources: schema.ChosenResourcesEntity | null,
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
  demandsPerStage: schema.DemandsPerStageEntity | null,
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

const mapToSchedule = (schedule: schema.ScheduleEntity | null): Schedule =>
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
}: schema.StageEntity): Stage =>
  new Stage(
    stageName,
    ObjectSet.from(dependencies.map(mapToStage)),
    ObjectSet.from(resources.map(mapToResourceId)),
    duration,
  );

const mapToDemand = ({ capability }: schema.DemandEntity): Demand =>
  new Demand(mapToCapability(capability));

const mapToTimeSlot = ({ from, to }: schema.TimeSlotEntity): TimeSlot =>
  new TimeSlot(new UTCDate(from), new UTCDate(to));

const mapToCapability = ({ name, type }: schema.CapabilityEntity): Capability =>
  new Capability(name, type);

const mapToResourceId = (id: string): ResourceId =>
  ResourceId.from(UUID.from(id));

const mapFromProject = (
  project: Project,
): typeof schema.projects.$inferSelect => {
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
): schema.ParallelStagesListEntity => {
  return {
    all: parallelisedStages.all.map((ps: ParallelStages) => {
      return { stages: ps.stages.map(mapFromStage) };
    }),
  };
};

const mapFromDemands = (demands: Demands): schema.DemandsEntity => {
  return {
    all: demands.all.map(mapFromDemand),
  };
};

const mapFromChosenResources = (
  chosenResources: ChosenResources,
): schema.ChosenResourcesEntity => {
  return {
    resources: chosenResources.resources.map(mapFromResourceId),
    timeSlot: mapFromTimeSlot(chosenResources.timeSlot),
  };
};

const mapFromDemandsPerStage = (
  demandsPerStage: DemandsPerStage,
): schema.DemandsPerStageEntity => {
  return {
    demands: demandsPerStage.demands.map(({ key, value }) => {
      return { key, value: mapFromDemands(value) };
    }),
  };
};

const mapFromSchedule = (schedule: Schedule): schema.ScheduleEntity => {
  return {
    dates: schedule.dates.map(({ key, value }) => {
      return { key, value: mapFromTimeSlot(value) };
    }),
  };
};

const mapFromStage = (stage: Stage): schema.StageEntity => {
  return {
    stageName: stage.name,
    dependencies: stage.dependencies.map(mapFromStage),
    resources: stage.resources.map(mapFromResourceId),
    duration: stage.duration,
  };
};

const mapFromDemand = (demand: Demand): schema.DemandEntity => {
  return {
    capability: mapFromCapability(demand.capability),
  };
};

const mapFromTimeSlot = (timeSlot: TimeSlot): schema.TimeSlotEntity => {
  return { from: timeSlot.from.toJSON(), to: timeSlot.to.toJSON() };
};

const mapFromCapability = (capability: Capability): schema.CapabilityEntity => {
  return {
    name: capability.name,
    type: capability.type,
  };
};

const mapFromResourceId = (resource: ResourceId): string => resource;
