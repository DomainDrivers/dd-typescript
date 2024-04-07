import { Capability, TimeSlot } from '#shared';
import type { AllocatableCapabilityId } from '.';

export class AllocatedCapability {
  constructor(
    public readonly allocatedCapabilityId: AllocatableCapabilityId,
    public readonly capability: Capability,
    public readonly timeSlot: TimeSlot,
  ) {}
}
