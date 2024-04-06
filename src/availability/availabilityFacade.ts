/* eslint-disable @typescript-eslint/no-unused-vars */
import type { TimeSlot } from '../shared';
import type { Owner } from './calendars';
import type { ResourceAvailabilityId } from './resourceAvailabilityId';

export class AvailabilityFacade {
  //can start with an in-memory repository for the aggregate
  public createResourceSlots = (
    resourceId: ResourceAvailabilityId,
    timeslot: TimeSlot,
  ): void => {};

  public block = (
    resourceId: ResourceAvailabilityId,
    timeslot: TimeSlot,
    requester: Owner,
  ): boolean => {
    return true;
  };

  public release = (
    resourceId: ResourceAvailabilityId,
    timeslot: TimeSlot,
    requester: Owner,
  ): boolean => {
    return true;
  };

  public disable = (
    resourceId: ResourceAvailabilityId,
    timeslot: TimeSlot,
    requester: Owner,
  ): boolean => {
    return true;
  };
}
