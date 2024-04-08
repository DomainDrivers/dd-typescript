import { AvailabilityFacade, Calendars, ResourceId } from '#availability';
import { TimeSlot } from '#shared';
import { ProjectId } from '#simulation';
import { transactional } from '#storage';
import { Clock, ObjectSet, event, type EventsPublisher } from '#utils';
import { ChosenResources } from './chosenResources';
import type { NeededResourcesChosen } from './neededResourcesChosen';
import { Stage } from './parallelization';
import type { ProjectRepository } from './projectRepository';
import { Schedule } from './schedule';

export class PlanChosenResources {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly availabilityFacade: AvailabilityFacade,
    private readonly eventsPublisher: EventsPublisher,
    private readonly clock: Clock,
  ) {
    this.repository = repository;
    this.availabilityFacade = availabilityFacade;
  }

  @transactional
  public async defineResourcesWithinDates(
    projectId: ProjectId,
    chosenResources: ObjectSet<ResourceId>,
    timeBoundaries: TimeSlot,
  ): Promise<void> {
    const project = await this.repository.getById(projectId);
    project.addChosenResources(
      new ChosenResources(chosenResources, timeBoundaries),
    );
    await this.eventsPublisher.publish(
      event<NeededResourcesChosen>(
        'NeededResourcesChosen',
        {
          projectId,
          neededResources: chosenResources,
          stageTimeSlot: timeBoundaries,
        },
        this.clock,
      ),
    );
    await this.repository.save(project);
  }

  @transactional
  public async adjustStagesToResourceAvailability(
    projectId: ProjectId,
    timeBoundaries: TimeSlot,
    ...stages: Stage[]
  ): Promise<void> {
    const neededResources = this.neededResources(stages);
    let project = await this.repository.getById(projectId);
    await this.defineResourcesWithinDates(
      projectId,
      neededResources,
      timeBoundaries,
    );
    const neededResourcesCalendars =
      await this.availabilityFacade.loadCalendars(
        neededResources,
        timeBoundaries,
      );
    const schedule = this.createScheduleAdjustingToCalendars(
      neededResourcesCalendars,
      stages,
    );
    project = await this.repository.getById(projectId);
    project.addSchedule(schedule);
    await this.repository.save(project);
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
