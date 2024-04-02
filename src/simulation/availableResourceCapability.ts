import type { CapacityDimension } from '#optimization';
import { Capability, TimeSlot } from '#shared';
import { deepEquals, type UUID } from '#utils';

export class AvailableResourceCapability implements CapacityDimension {
  public readonly __brand = 'CapacityDimension';

  constructor(
    public readonly resourceId: UUID,
    public readonly capability: Capability,
    public readonly timeSlot: TimeSlot,
  ) {}

  public performs = (capability: Capability) =>
    deepEquals(capability, this.capability);
}
