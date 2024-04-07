import { CapabilitySelector, SelectingPolicy } from '#allocation';
import type { Capability, TimeSlot } from '#shared';
import {
  AvailableResourceCapability,
  SimulatedCapabilities,
} from '#simulation';
import { ObjectSet, type UUID } from '#utils';

export class AvailableCapabilitiesBuilder {
  private readonly availabilities: AvailableResourceCapability[] = [];
  private currentResourceId?: UUID;
  private capabilities?: ObjectSet<Capability>;
  private timeSlot?: TimeSlot;
  private selectingPolicy?: SelectingPolicy;

  public withEmployee = (id: UUID) => {
    if (
      this.currentResourceId &&
      this.capabilities &&
      this.selectingPolicy &&
      this.timeSlot
    ) {
      this.availabilities.push(
        new AvailableResourceCapability(
          this.currentResourceId,
          new CapabilitySelector(this.capabilities, this.selectingPolicy),
          this.timeSlot,
        ),
      );
    }
    this.currentResourceId = id;
    return this;
  };

  public thatBrings = (capability: Capability) => {
    this.capabilities = ObjectSet.of(capability);
    this.selectingPolicy = SelectingPolicy.ONE_OF_ALL;
    return this;
  };

  public thatIsAvailableAt(timeSlot: TimeSlot) {
    this.timeSlot = timeSlot;
    return this;
  }

  public build() {
    if (
      this.currentResourceId &&
      this.capabilities &&
      this.selectingPolicy &&
      this.timeSlot
    ) {
      this.availabilities.push(
        new AvailableResourceCapability(
          this.currentResourceId,
          new CapabilitySelector(this.capabilities, this.selectingPolicy),
          this.timeSlot,
        ),
      );
    }
    return new SimulatedCapabilities(this.availabilities);
  }
}
