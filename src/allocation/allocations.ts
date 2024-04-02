import type { TimeSlot } from '#shared';
import { ObjectSet, deepEquals } from '#utils';
import { AllocatedCapability } from './allocatedCapability';

export class Allocations {
  constructor(public readonly all: ObjectSet<AllocatedCapability>) {}

  public static none = () => new Allocations(ObjectSet.empty());

  public add = (newOne: AllocatedCapability) =>
    new Allocations(ObjectSet.from([...this.all, newOne]));

  public remove = (
    toRemove: AllocatedCapability,
    slot: TimeSlot,
  ): Allocations => {
    const allocatedResource = this.find(toRemove, slot);

    return allocatedResource !== null
      ? this.removeFromSlot(allocatedResource, slot)
      : this;
  };

  private removeFromSlot = (
    allocatedResource: AllocatedCapability,
    slot: TimeSlot,
  ): Allocations => {
    const leftOvers: ObjectSet<AllocatedCapability> = ObjectSet.from(
      allocatedResource.timeSlot
        .leftoverAfterRemovingCommonWith(slot)
        .filter((leftOver) => leftOver.within(allocatedResource.timeSlot))
        .map(
          (leftOver) =>
            new AllocatedCapability(
              allocatedResource.resourceId,
              allocatedResource.capability,
              leftOver,
            ),
        ),
    );
    const newSlots = ObjectSet.from(this.all);
    newSlots.delete(allocatedResource);
    newSlots.pushAll(leftOvers);
    return new Allocations(newSlots);
  };

  public find = (
    capability: AllocatedCapability,
    _timeSlot: TimeSlot,
  ): AllocatedCapability | null =>
    this.all.find((ar: AllocatedCapability) => deepEquals(ar, capability)) ??
    null;
}
