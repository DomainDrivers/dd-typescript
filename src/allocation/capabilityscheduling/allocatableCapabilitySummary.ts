import type { TimeSlot } from '#shared';
import type { CapabilitySelector } from '.';
import type { AllocatableCapabilityId } from './allocatableCapabilityId';
import type { AllocatableResourceId } from './allocatableResourceId';

export class AllocatableCapabilitySummary {
  constructor(
    public readonly id: AllocatableCapabilityId,
    public readonly allocatableResourceId: AllocatableResourceId,
    public readonly capabilities: CapabilitySelector,
    public readonly timeSlot: TimeSlot,
  ) {}
}
