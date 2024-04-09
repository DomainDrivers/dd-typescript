import type { AvailabilityFacade, Calendars, ResourceId } from '#availability';
import {
  PlanChosenResources,
  PlanningFacade,
  Project,
  ProjectId,
  StageParallelization,
  type ProjectRepository,
} from '#planning';
import { Clock, ObjectSet, type TransactionAwareEventPublisher } from '#utils';
import { UTCDate } from '@date-fns/utc';
import type { TimeSlot } from '../../src/shared';
import { InMemoryRepository, nulloTransactionContext } from '../../src/storage';

export class PlanningTestConfiguration {
  public static planningFacade(
    eventsPublisher: TransactionAwareEventPublisher,
    projectRepository: ProjectRepository,
  ): PlanningFacade {
    const clock = Clock.fixed(new UTCDate());
    const planChosenResources = nulloTransactionContext(
      new PlanChosenResources(
        projectRepository,
        PlanningTestConfiguration.getAvailabilityFacadeMock(),
        eventsPublisher,
        clock,
      ),
      eventsPublisher.commit,
    );
    return nulloTransactionContext(
      new PlanningFacade(
        projectRepository,
        new StageParallelization(),
        planChosenResources,
        eventsPublisher,
        clock,
      ),
      eventsPublisher.commit,
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
