import { AvailableResourceCapability } from './availableResourceCapability';
import type { Capability } from './capability';
import type { TimeSlot } from './timeslot';

export class Demand {
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
