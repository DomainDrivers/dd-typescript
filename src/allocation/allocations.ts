import type { TimeSlot } from '#shared';
import { ObjectSet } from '#utils';
import type { AllocatableCapabilityId } from '.';
import { AllocatedCapability } from './allocatedCapability';

export class Allocations {
  constructor(public readonly all: ObjectSet<AllocatedCapability>) {}

  public static none = () => new Allocations(ObjectSet.empty());

  public add = (newOne: AllocatedCapability) =>
    new Allocations(ObjectSet.from([...this.all, newOne]));

  public remove = (
    toRemove: AllocatableCapabilityId,
    slot: TimeSlot,
  ): Allocations => {
    const allocatedResource = this.find(toRemove);

    return allocatedResource !== null
      ? this.removeFromSlot(allocatedResource, slot)
      : this;
  };

  private removeFromSlot = (
    allocatedCapability: AllocatedCapability,
    slot: TimeSlot,
  ): Allocations => {
    const leftOvers: ObjectSet<AllocatedCapability> = ObjectSet.from(
      allocatedCapability.timeSlot
        .leftoverAfterRemovingCommonWith(slot)
        .filter((leftOver) => leftOver.within(allocatedCapability.timeSlot))
        .map(
          (leftOver) =>
            new AllocatedCapability(
              allocatedCapability.allocatedCapabilityId,
              allocatedCapability.capability,
              leftOver,
            ),
        ),
    );
    const newSlots = ObjectSet.from(this.all);
    newSlots.delete(allocatedCapability);
    newSlots.pushAll(leftOvers);
    return new Allocations(newSlots);
  };

  public find = (
    allocatedCapabilityID: AllocatableCapabilityId,
  ): AllocatedCapability | null =>
    this.all.find(
      (ar: AllocatedCapability) =>
        ar.allocatedCapabilityId === allocatedCapabilityID,
    ) ?? null;
}
