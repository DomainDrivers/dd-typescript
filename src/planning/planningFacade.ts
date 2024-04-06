import type { ResourceId } from '#availability';
import { TimeSlot } from '#shared';
import { transactional } from '#storage';
import { Duration, ObjectSet } from '#utils';
import type { UTCDate } from '@date-fns/utc';
import type { Demands, DemandsPerStage } from './demands';
import {
  DurationCalculator,
  ParallelStagesList,
  Stage,
  StageParallelization,
} from './parallelization';
import type { PlanChosenResources } from './planChosenResources';
import { Project } from './project';
import { ProjectCard } from './projectCard';
import { ProjectId } from './projectId';
import type { ProjectRepository } from './projectRepository';
import type { Schedule } from './schedule';

export class PlanningFacade {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly parallelization: StageParallelization,
    private readonly planChosenResourcesService: PlanChosenResources,
  ) {}

  @transactional
  public addNewProject(name: string, ...stages: Stage[]): Promise<ProjectId> {
    const parallelizedStages = this.parallelization.of(ObjectSet.from(stages));
    return this.addNewProjectParalellized(name, parallelizedStages);
  }

  @transactional
  public async addNewProjectParalellized(
    name: string,
    parallelizedStages: ParallelStagesList,
  ): Promise<ProjectId> {
    const project = new Project(name, parallelizedStages);
    await this.repository.save(project);
    return project.getId();
  }

  @transactional
  public async defineStartDate(
    projectId: ProjectId,
    possibleStartDate: UTCDate,
  ): Promise<void> {
    const project = await this.repository.getById(projectId);
    project.addScheduleBasedOnStartDay(possibleStartDate);
    return this.repository.save(project);
  }

  @transactional
  public async defineProjectStages(
    projectId: ProjectId,
    ...stages: Stage[]
  ): Promise<void> {
    const project = await this.repository.getById(projectId);
    const parallelizedStages = this.parallelization.of(ObjectSet.from(stages));
    project.defineStages(parallelizedStages);
    return this.repository.save(project);
  }

  @transactional
  public async addDemands(
    projectId: ProjectId,
    demands: Demands,
  ): Promise<void> {
    const project = await this.repository.getById(projectId);
    project.addDemands(demands);
    return this.repository.save(project);
  }

  @transactional
  public async defineDemandsPerStage(
    projectId: ProjectId,
    demandsPerStage: DemandsPerStage,
  ): Promise<void> {
    const project = await this.repository.getById(projectId);
    project.addDemandsPerStage(demandsPerStage);
    return this.repository.save(project);
  }

  @transactional
  public defineResourcesWithinDates(
    projectId: ProjectId,
    chosenResources: ObjectSet<ResourceId>,
    timeBoundaries: TimeSlot,
  ): Promise<void> {
    return this.planChosenResourcesService.defineResourcesWithinDates(
      projectId,
      chosenResources,
      timeBoundaries,
    );
  }

  @transactional
  public async adjustStagesToResourceAvailability(
    projectId: ProjectId,
    timeBoundaries: TimeSlot,
    ...stages: Stage[]
  ): Promise<void> {
    return this.planChosenResourcesService.adjustStagesToResourceAvailability(
      projectId,
      timeBoundaries,
      ...stages,
    );
  }

  @transactional
  public async planCriticalStageWithResource(
    projectId: ProjectId,
    criticalStage: Stage,
    criticalResource: ResourceId,
    stageTimeSlot: TimeSlot,
  ): Promise<void> {
    const project = await this.repository.getById(projectId);
    project.addScheduleBasedOnReferenceStageTimeSlot(
      criticalStage,
      stageTimeSlot,
    );
  }

  @transactional
  public async planCriticalStage(
    projectId: ProjectId,
    criticalStage: Stage,
    stageTimeSlot: TimeSlot,
  ): Promise<void> {
    const project = await this.repository.getById(projectId);
    project.addScheduleBasedOnReferenceStageTimeSlot(
      criticalStage,
      stageTimeSlot,
    );
  }

  @transactional
  public async defineManualSchedule(
    projectId: ProjectId,
    schedule: Schedule,
  ): Promise<void> {
    const project = await this.repository.getById(projectId);
    project.addSchedule(schedule);
  }

  public durationOf = (...stages: Stage[]): Duration =>
    DurationCalculator.calculate(stages);

  public load = async (projectId: ProjectId): Promise<ProjectCard> => {
    const project = await this.repository.getById(projectId);
    return PlanningFacade.toSummary(project);
  };

  public loadAll = async (
    projectsIds: ObjectSet<ProjectId>,
  ): Promise<ProjectCard[]> =>
    (await this.repository.findAllById(projectsIds)).map((project) =>
      PlanningFacade.toSummary(project),
    );

  private static toSummary = (project: Project) =>
    new ProjectCard(
      project.getId(),
      project.getName(),
      project.getParallelizedStages(),
      project.getAllDemands(),
      project.getSchedule(),
      project.getDemandsPerStage(),
      project.getChosenResources(),
    );
}
