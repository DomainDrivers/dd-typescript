import { Capability, TimeSlot } from '#shared';
import { type UUID } from '#utils';

export class AllocatedCapability {
  constructor(
    public readonly resourceId: UUID,
    public readonly capability: Capability,
    public readonly timeSlot: TimeSlot,
  ) {}
}
