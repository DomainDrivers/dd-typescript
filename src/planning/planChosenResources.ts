import { AvailabilityFacade, Calendars } from '#availability';
import { ResourceName, TimeSlot } from '#shared';
import { ProjectId } from '#simulation';
import { transactional } from '#storage';
import { ObjectSet } from '#utils';
import { ChosenResources } from './chosenResources';
import { Stage } from './parallelization';
import type { ProjectRepository } from './projectRepository';
import { Schedule } from './schedule';

export class PlanChosenResources {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly availabilityFacade: AvailabilityFacade,
  ) {
    this.repository = repository;
    this.availabilityFacade = availabilityFacade;
  }

  @transactional()
  public async defineResourcesWithinDates(
    projectId: ProjectId,
    chosenResources: ObjectSet<ResourceName>,
    timeBoundaries: TimeSlot,
  ): Promise<void> {
    const project = await this.repository.getById(projectId);
    project.addChosenResources(
      new ChosenResources(chosenResources, timeBoundaries),
    );

    await this.repository.save(project);
  }

  @transactional()
  public async adjustStagesToResourceAvailability(
    projectId: ProjectId,
    timeBoundaries: TimeSlot,
    ...stages: Stage[]
  ): Promise<void> {
    const neededResources = this.neededResources(stages);
    const project = await this.repository.getById(projectId);
    await this.defineResourcesWithinDates(
      projectId,
      neededResources,
      timeBoundaries,
    );
    //TODO when availability is implemented
    const neededResourcesCalendars = Calendars.of();
    const schedule = this.createScheduleAdjustingToCalendars(
      neededResourcesCalendars,
      stages,
    );
    project.addSchedule(schedule);
  }

  private createScheduleAdjustingToCalendars = (
    neededResourcesCalendars: Calendars,
    stages: Stage[],
  ) =>
    Schedule.basedOnChosenResourcesAvailability(
      neededResourcesCalendars,
      stages,
    );

  private neededResources = (stages: Stage[]) =>
    ObjectSet.from(stages.flatMap((stage) => stage.resources));
}
