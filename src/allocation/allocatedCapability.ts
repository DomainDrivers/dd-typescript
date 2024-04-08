import { TimeSlot } from '#shared';
import type { AllocatableCapabilityId, CapabilitySelector } from '.';

export class AllocatedCapability {
  constructor(
    public readonly allocatedCapabilityId: AllocatableCapabilityId,
    public readonly capability: CapabilitySelector,
    public readonly timeSlot: TimeSlot,
  ) {}
}
