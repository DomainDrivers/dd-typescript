import type { TimeSlot } from '#shared';
import {
  AvailableResourceCapability,
  Capability,
  SimulatedCapabilities,
} from '#simulation';
import type { UUID } from '#utils';

export class AvailableCapabilitiesBuilder {
  private readonly availabilities: AvailableResourceCapability[] = [];
  private currentResourceId?: UUID;
  private capability?: Capability;
  private timeSlot?: TimeSlot;

  public withEmployee = (id: UUID) => {
    if (this.currentResourceId && this.capability && this.timeSlot) {
      this.availabilities.push(
        new AvailableResourceCapability(
          this.currentResourceId,
          this.capability,
          this.timeSlot,
        ),
      );
    }
    this.currentResourceId = id;
    return this;
  };

  public thatBrings = (capability: Capability) => {
    this.capability = capability;
    return this;
  };

  public thatIsAvailableAt(timeSlot: TimeSlot) {
    this.timeSlot = timeSlot;
    return this;
  }

  public build() {
    if (this.currentResourceId && this.capability && this.timeSlot) {
      this.availabilities.push(
        new AvailableResourceCapability(
          this.currentResourceId,
          this.capability,
          this.timeSlot,
        ),
      );
    }
    return new SimulatedCapabilities(this.availabilities);
  }
}
