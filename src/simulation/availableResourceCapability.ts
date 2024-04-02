import { UUID, deepEquals } from '../utils';
import { Capability } from './capability';
import type { TimeSlot } from './timeslot';

export class AvailableResourceCapability {
  public readonly __brand = 'CapacityDimension';

  constructor(
    public readonly resourceId: UUID,
    public readonly capability: Capability,
    public readonly timeSlot: TimeSlot,
  ) {}

  public performs = (capability: Capability) =>
    deepEquals(capability, this.capability);
}
