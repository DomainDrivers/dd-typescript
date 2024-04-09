import type { AvailabilityFacade, Calendars, ResourceId } from '#availability';
import {
  PlanChosenResources,
  PlanningFacade,
  StageParallelization,
} from '#planning';
import type { TimeSlot } from '#shared';
import { Clock, ObjectSet, type TransactionAwareEventPublisher } from '#utils';
import { UTCDate } from '@date-fns/utc';
import { nulloTransactionContext } from '../../src/storage';
import { PlanningDbTestConfiguration } from './planningDbTestConfiguration';

export class PlanningTestConfiguration {
  public static planningFacade(
    eventsPublisher: TransactionAwareEventPublisher,
  ): PlanningFacade {
    const clock = Clock.fixed(new UTCDate());
    const repository = PlanningDbTestConfiguration.inMemoryProjectDb();
    const planChosenResources = nulloTransactionContext(
      new PlanChosenResources(
        repository,
        PlanningTestConfiguration.getAvailabilityFacadeMock(),
        eventsPublisher,
        clock,
      ),
      eventsPublisher.commit,
    );
    return nulloTransactionContext(
      new PlanningFacade(
        repository,
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
