import { Capability, TimeSlot } from '#shared';
import { UUID, deepEquals } from '#utils';

export class AllocatedCapability {
  constructor(
    public readonly resourceId: UUID,
    public readonly capability: Capability,
    public readonly timeSlot: TimeSlot,
    public readonly allocatedCapabilityID: UUID = UUID.randomUUID(),
  ) {}

  public equals(other: AllocatedCapability): boolean {
    return (
      other &&
      deepEquals(this.resourceId, other.resourceId) &&
      deepEquals(this.capability, other.capability) &&
      deepEquals(this.timeSlot, other.timeSlot)
    );
  }
}
