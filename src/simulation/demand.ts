import type { WeightDimension } from '#optimization';
import type { TimeSlot } from '#shared';
import { AvailableResourceCapability } from './availableResourceCapability';
import type { Capability } from './capability';

export class Demand implements WeightDimension<AvailableResourceCapability> {
  constructor(
    public readonly capability: Capability,
    public readonly slot: TimeSlot,
  ) {}

  public static demandFor = (
    capability: Capability,
    slot: TimeSlot,
  ): Demand => {
    return new Demand(capability, slot);
  };

  public isSatisfiedBy = (
    availableCapability: AvailableResourceCapability,
  ): boolean =>
    availableCapability.performs(this.capability) &&
    this.slot.within(availableCapability.timeSlot);
}
