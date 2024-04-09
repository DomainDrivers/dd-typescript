import { dbconnection } from '#storage';
import { ObjectMap, event, type Clock, type EventsPublisher } from '#utils';
import type { UTCDate } from '@date-fns/utc';
import { NotSatisfiedDemands } from './notSatisfiedDemands';
import { ProjectAllocations } from './projectAllocations';
import type { ProjectAllocationsRepository } from './projectAllocationsRepository';

export class PublishMissingDemandsService {
  constructor(
    private readonly projectAllocationsRepository: ProjectAllocationsRepository,
    private readonly createHourlyDemandsSummaryService: CreateHourlyDemandsSummaryService,
    private readonly eventsPublisher: EventsPublisher,
    private readonly clock: Clock,
  ) {
    this.projectAllocationsRepository = projectAllocationsRepository;
    this.createHourlyDemandsSummaryService = createHourlyDemandsSummaryService;
    this.eventsPublisher = eventsPublisher;
    this.clock = clock;
  }

  @dbconnection
  public async publish(): Promise<void> {
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
  }
}

export class CreateHourlyDemandsSummaryService {
  public create = (
    projectAllocations: ProjectAllocations[],
    when: UTCDate,
  ): NotSatisfiedDemands =>
    event('NotSatisfiedDemands', {
      missingDemands: ObjectMap.from(
        projectAllocations
          .filter((pa) => pa.hasTimeSlot())
          .map((pa) => [pa.id, pa.missingDemands()]),
      ),
      occurredAt: when,
    });
}
