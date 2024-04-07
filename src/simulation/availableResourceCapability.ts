import { CapabilitySelector } from '#allocation';
import type { CapacityDimension } from '#optimization';
import { Capability, TimeSlot } from '#shared';
import { type UUID } from '#utils';

export class AvailableResourceCapability implements CapacityDimension {
  public readonly __brand = 'CapacityDimension';

  public readonly capabilitySelector: CapabilitySelector;

  constructor(
    public readonly resourceId: UUID,
    capabilityOrSelector: CapabilitySelector | Capability,
    public readonly timeSlot: TimeSlot,
  ) {
    this.capabilitySelector =
      capabilityOrSelector instanceof CapabilitySelector
        ? capabilityOrSelector
        : CapabilitySelector.canJustPerform(capabilityOrSelector);
  }

  public performs = (capability: Capability) =>
    this.capabilitySelector.canPerform(capability);
}
