import { ObjectMap, event, type Clock, type EventsPublisher } from '#utils';
import type { UTCDate } from '@date-fns/utc';
import {
  NotSatisfiedDemands,
  ProjectAllocations,
  type ProjectAllocationsRepository,
} from '.';

export class PublishMissingDemandsService {
  constructor(
    private readonly projectAllocationsRepository: ProjectAllocationsRepository,
    private readonly createHourlyDemandsSummaryService: CreateHourlyDemandsSummaryService,
    private readonly eventsPublisher: EventsPublisher,
    private readonly clock: Clock,
  ) {}

  // @Scheduled(cron = "@hourly")
  public publish = async (): Promise<void> => {
    const when = this.clock.now();
    const projectAllocations =
      await this.projectAllocationsRepository.findAllContainingDate(when);
    const missingDemands = this.createHourlyDemandsSummaryService.create(
      projectAllocations,
      when,
    );
    //add metadata to event
    //if needed call EventStore and translate multiple private events to a new published event
    return this.eventsPublisher.publish(missingDemands);
  };
}

class CreateHourlyDemandsSummaryService {
  public create = (
    projectAllocations: ProjectAllocations[],
    when: UTCDate,
  ): NotSatisfiedDemands =>
    event('NotSatisfiedDemands', {
      occurredAt: when,
      missingDemands: ObjectMap.from(
        projectAllocations.map((pa) => [pa.id, pa.missingDemands()]),
      ),
    });
}
