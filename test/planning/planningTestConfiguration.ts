import type { AvailabilityFacade, Calendars, ResourceId } from '#availability';
import {
  PlanChosenResources,
  PlanningFacade,
  Project,
  ProjectId,
  StageParallelization,
  type ProjectRepository,
} from '#planning';
import { Clock, ObjectSet, type EventsPublisher } from '#utils';
import { UTCDate } from '@date-fns/utc';
import type { TimeSlot } from '../../src/shared';
import { InMemoryRepository } from '../../src/storage';
import { mockTransactionContext } from '../setup/mockTransactionContext';

export class PlanningTestConfiguration {
  public static planningFacade(
    eventsPublisher: EventsPublisher,
    projectRepository: ProjectRepository,
  ): PlanningFacade {
    const clock = Clock.fixed(new UTCDate());
    const planChosenResources = mockTransactionContext(
      new PlanChosenResources(
        projectRepository,
        PlanningTestConfiguration.getAvailabilityFacadeMock(),
        eventsPublisher,
        clock,
      ),
    );
    return mockTransactionContext(
      new PlanningFacade(
        projectRepository,
        new StageParallelization(),
        planChosenResources,
        eventsPublisher,
        clock,
      ),
    );
  }

  private static getAvailabilityFacadeMock = (): AvailabilityFacade => {
    return {
      loadCalendars: (
        _resources: ObjectSet<ResourceId>,
        _within: TimeSlot,
      ): Promise<Calendars> => Promise.resolve(null!),
    } as AvailabilityFacade;
  };
}

export class InMemoryProjectRepository
  extends InMemoryRepository<Project, ProjectId>
  implements ProjectRepository
{
  constructor() {
    super((p) => p.getId());
  }
}
