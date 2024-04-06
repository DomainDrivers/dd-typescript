import type { TimeSlot } from '../shared';
import { ObjectSet, deepEquals } from '../utils';
import { Owner } from './owner';
import { ResourceAvailability } from './resourceAvailability';
import { ResourceAvailabilityId } from './resourceAvailabilityId';
import { Segments, defaultSegment } from './segment';

export class ResourceGroupedAvailability {
  constructor(
    private readonly resourceAvailabilities: ResourceAvailability[],
  ) {}

  // static of = (resourceId: ResourceAvailabilityId , timeslot: TimeSlot): ResourceGroupedAvailability => {
  //     const resourceAvailabilities =  Segments
  //             .split(timeslot, defaultSegment())
  //
  //             .map(segment => new ResourceAvailability(ResourceAvailabilityId.newOne(), resourceId, segment))
  //             .toList();
  //     return new ResourceGroupedAvailability(resourceAvailabilities);
  // }

  public static of = (
    resourceId: ResourceAvailabilityId,
    timeslot: TimeSlot,
    parentId: ResourceAvailabilityId | null = null,
  ): ResourceGroupedAvailability => {
    const resourceAvailabilities = Segments.split(
      timeslot,
      defaultSegment(),
    ).map(
      (segment) =>
        new ResourceAvailability(
          ResourceAvailabilityId.newOne(),
          resourceId,
          segment,
          parentId,
        ),
    );
    return new ResourceGroupedAvailability(resourceAvailabilities);
  };

  public block = (requester: Owner): boolean => {
    for (const resourceAvailability of this.resourceAvailabilities) {
      if (!resourceAvailability.block(requester)) {
        return false;
      }
    }
    return true;
  };

  public disable = (requester: Owner): boolean => {
    for (const resourceAvailability of this.resourceAvailabilities) {
      if (!resourceAvailability.disable(requester)) {
        return false;
      }
    }
    return true;
  };

  public release = (requester: Owner): boolean => {
    for (const resourceAvailability of this.resourceAvailabilities) {
      if (!resourceAvailability.release(requester)) {
        return false;
      }
    }
    return true;
  };

  public get availabilities(): ResourceAvailability[] {
    return this.resourceAvailabilities;
  }

  public owners = (): ObjectSet<Owner> =>
    ObjectSet.from(this.resourceAvailabilities.map((r) => r.blockedBy()));

  public resourceId = (): ResourceAvailabilityId | null =>
    //resourceId are the same;
    this.resourceAvailabilities.map((r) => r.resourceId)[0] ?? null;

  public size = (): number => this.resourceAvailabilities.length;

  public blockedEntirelyBy = (owner: Owner): boolean =>
    this.resourceAvailabilities.every((ra) =>
      deepEquals(ra.blockedBy(), owner),
    );

  public isDisabledEntirelyBy = (owner: Owner): boolean =>
    this.resourceAvailabilities.every((ra) => ra.isDisabledBy(owner));

  public findBlockedBy = (owner: Owner): ResourceAvailability[] =>
    this.resourceAvailabilities.filter((ra) =>
      deepEquals(ra.blockedBy(), owner),
    );

  public isEntirelyAvailable = (): boolean =>
    this.resourceAvailabilities.every((ra) => ra.blockedBy().byNone());
}
