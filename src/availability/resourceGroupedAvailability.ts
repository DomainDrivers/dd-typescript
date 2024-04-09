import type { ResourceId } from '.';
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

  public static of = (
    resourceId: ResourceId,
    timeslot: TimeSlot,
    parentId: ResourceId | null = null,
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

  public resourceId = (): ResourceId | null =>
    //resourceId are the same;
    this.resourceAvailabilities.map((r) => r.resourceId)[0] ?? null;

  public size = (): number => this.resourceAvailabilities.length;

  public blockedEntirelyBy = (owner: Owner): boolean =>
    this.resourceAvailabilities.every((ra) =>
      deepEquals(ra.blockedBy(), owner),
    );

  public isDisabledEntirelyBy = (owner: Owner): boolean =>
    this.resourceAvailabilities.every((ra) => ra.isDisabledBy(owner));

  public isEntirelyWithParentId = (parentId: ResourceId) =>
    this.resourceAvailabilities.every((ra) =>
      deepEquals(ra.resourceParentId, parentId),
    );

  public findBlockedBy = (owner: Owner): ResourceAvailability[] =>
    this.resourceAvailabilities.filter((ra) =>
      deepEquals(ra.blockedBy(), owner),
    );

  public isEntirelyAvailable = (): boolean =>
    this.resourceAvailabilities.every((ra) => ra.blockedBy().byNone());

  public hasNoSlots = (): boolean => this.resourceAvailabilities.length === 0;

  public owners = () =>
    ObjectSet.from(this.resourceAvailabilities.map((ra) => ra.blockedBy()));
}
