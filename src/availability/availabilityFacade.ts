/* eslint-disable @typescript-eslint/no-unused-vars */
import type { TimeSlot } from '#shared';
import { transactional } from '#storage';
import {
  Calendar,
  Calendars,
  ResourceGroupedAvailability,
  Segments,
  defaultSegment,
} from '.';
import { dbconnection } from '../storage/transactionalDecorator';
import type { ObjectSet } from '../utils';
import type { Owner } from './owner';
import type { ResourceAvailabilityReadModel } from './resourceAvailabilityReadModel';
import type { ResourceAvailabilityRepository } from './resourceAvailabilityRepository';
import type { ResourceId } from './resourceId';

export class AvailabilityFacade {
  constructor(
    private readonly repository: ResourceAvailabilityRepository,
    private readonly availabilityReadModel: ResourceAvailabilityReadModel,
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
    return this.repository.saveNewGrouped(groupedAvailability);
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

    if (toBlock.hasNoSlots()) {
      return false;
    }
    const result = toBlock.block(requester);

    if (result) {
      return this.repository.saveGroupedCheckingVersion(toBlock);
    }
    return result;
  }

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
      return this.repository.saveGroupedCheckingVersion(toRelease);
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
    let result = toDisable.disable(requester);
    if (result) {
      result = await this.repository.saveGroupedCheckingVersion(toDisable);
    }
    return result;
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
      await this.repository.loadAllWithinSlot(resourceId, normalized),
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
      await this.repository.loadAllWithinSlot(resourceId, normalized),
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
      await this.repository.loadAllByParentIdWithinSlot(parentId, normalized),
    );
  }
}
