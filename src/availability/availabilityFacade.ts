/* eslint-disable @typescript-eslint/no-unused-vars */
import type { TimeSlot } from '#shared';
import { transactional } from '#storage';
import {
  Calendar,
  Calendars,
  ResourceGroupedAvailability,
  Segments,
  defaultSegment,
  type ResourceTakenOver,
} from '.';
import { dbconnection } from '../storage/transactionalDecorator';
import { Clock, event, type EventsPublisher, type ObjectSet } from '../utils';
import type { Owner } from './owner';
import type { ResourceAvailabilityReadModel } from './resourceAvailabilityReadModel';
import type { ResourceAvailabilityRepository } from './resourceAvailabilityRepository';
import type { ResourceId } from './resourceId';

export class AvailabilityFacade {
  constructor(
    private readonly availabilityRepository: ResourceAvailabilityRepository,
    private readonly availabilityReadModel: ResourceAvailabilityReadModel,
    private readonly eventsPublisher: EventsPublisher,
    private readonly clock: Clock,
  ) {}

  @transactional
  public createResourceSlots(
    resourceId: ResourceId,
    timeslot: TimeSlot,
    parentId?: ResourceId,
  ): Promise<void> {
    const groupedAvailability = ResourceGroupedAvailability.of(
      resourceId,
      timeslot,
      parentId,
    );
    return this.availabilityRepository.saveNewGrouped(groupedAvailability);
  }

  @dbconnection
  public loadCalendar(
    resourceId: ResourceId,
    within: TimeSlot,
  ): Promise<Calendar> {
    const normalized = Segments.normalizeToSegmentBoundaries(
      within,
      defaultSegment(),
    );
    return this.availabilityReadModel.load(resourceId, normalized);
  }

  @dbconnection
  public loadCalendars(
    resources: ObjectSet<ResourceId>,
    within: TimeSlot,
  ): Promise<Calendars> {
    const normalized = Segments.normalizeToSegmentBoundaries(
      within,
      defaultSegment(),
    );
    return this.availabilityReadModel.loadAll(resources, normalized);
  }

  @transactional
  public async block(
    resourceId: ResourceId,
    timeSlot: TimeSlot,
    requester: Owner,
  ): Promise<boolean> {
    const toBlock = await this.findGrouped(resourceId, timeSlot);

    return this.blockGrouped(requester, toBlock);
  }

  private blockGrouped = async (
    requester: Owner,
    toBlock: ResourceGroupedAvailability,
  ): Promise<boolean> => {
    if (toBlock.hasNoSlots()) {
      return false;
    }
    const result = toBlock.block(requester);
    if (result) {
      return await this.availabilityRepository.saveGroupedCheckingVersion(
        toBlock,
      );
    }
    return result;
  };

  @transactional
  public async release(
    resourceId: ResourceId,
    timeSlot: TimeSlot,
    requester: Owner,
  ): Promise<boolean> {
    const toRelease = await this.findGrouped(resourceId, timeSlot);
    if (toRelease.hasNoSlots()) {
      return false;
    }
    const result = toRelease.release(requester);
    if (result) {
      return this.availabilityRepository.saveGroupedCheckingVersion(toRelease);
    }
    return result;
  }

  @transactional
  public async disable(
    resourceId: ResourceId,
    timeSlot: TimeSlot,
    requester: Owner,
  ): Promise<boolean> {
    const toDisable = await this.findGrouped(resourceId, timeSlot);
    if (toDisable.hasNoSlots()) {
      return false;
    }

    const previousOwners = toDisable.owners();
    let result = toDisable.disable(requester);
    if (result) {
      result =
        await this.availabilityRepository.saveGroupedCheckingVersion(toDisable);

      if (result)
        await this.eventsPublisher.publish(
          event<ResourceTakenOver>(
            'ResourceTakenOver',
            {
              resourceId,
              previousOwners,
              slot: timeSlot,
            },
            this.clock,
          ),
        );
    }
    return result;
  }

  @transactional
  public async blockRandomAvailable(
    resourceIds: ObjectSet<ResourceId>,
    within: TimeSlot,
    owner: Owner,
  ): Promise<ResourceId | null> {
    const normalized = Segments.normalizeToSegmentBoundaries(
      within,
      defaultSegment(),
    );
    const groupedAvailability =
      await this.availabilityRepository.loadAvailabilitiesOfRandomResourceWithin(
        resourceIds,
        normalized,
      );
    if (await this.blockGrouped(owner, groupedAvailability)) {
      return groupedAvailability.resourceId();
    } else {
      return null;
    }
  }

  private findGrouped = async (
    resourceId: ResourceId,
    within: TimeSlot,
  ): Promise<ResourceGroupedAvailability> => {
    const normalized = Segments.normalizeToSegmentBoundaries(
      within,
      defaultSegment(),
    );
    return new ResourceGroupedAvailability(
      await this.availabilityRepository.loadAllWithinSlot(
        resourceId,
        normalized,
      ),
    );
  };

  @dbconnection
  public async find(
    resourceId: ResourceId,
    within: TimeSlot,
  ): Promise<ResourceGroupedAvailability> {
    const normalized = Segments.normalizeToSegmentBoundaries(
      within,
      defaultSegment(),
    );
    return new ResourceGroupedAvailability(
      await this.availabilityRepository.loadAllWithinSlot(
        resourceId,
        normalized,
      ),
    );
  }

  @dbconnection
  public async findByParentId(
    parentId: ResourceId,
    within: TimeSlot,
  ): Promise<ResourceGroupedAvailability> {
    const normalized = Segments.normalizeToSegmentBoundaries(
      within,
      defaultSegment(),
    );
    return new ResourceGroupedAvailability(
      await this.availabilityRepository.loadAllByParentIdWithinSlot(
        parentId,
        normalized,
      ),
    );
  }
}
