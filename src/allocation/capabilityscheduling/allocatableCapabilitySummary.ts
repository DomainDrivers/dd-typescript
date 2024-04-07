import type { Capability, TimeSlot } from '#shared';
import type { AllocatableCapabilityId } from './allocatableCapabilityId';
import type { AllocatableResourceId } from './allocatableResourceId';

export class AllocatableCapabilitySummary {
  constructor(
    public readonly id: AllocatableCapabilityId,
    public readonly allocatableResourceId: AllocatableResourceId,
    public readonly capability: Capability,
    public readonly timeSlot: TimeSlot,
  ) {}
}
