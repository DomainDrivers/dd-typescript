import type { WeightDimension } from '#optimization';
import type { Capability, TimeSlot } from '#shared';
import { AvailableResourceCapability } from './availableResourceCapability';

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
