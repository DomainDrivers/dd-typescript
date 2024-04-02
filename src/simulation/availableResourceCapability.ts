import type { CapacityDimension } from '#optimization';
import { TimeSlot } from '#shared';
import { deepEquals, type UUID } from '#utils';
import { Capability } from './capability';

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
