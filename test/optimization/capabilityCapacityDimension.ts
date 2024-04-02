import { type CapacityDimension, type WeightDimension } from '#optimization';
import type { TimeSlot } from '#shared';
import { UUID } from '#utils';

export class CapabilityCapacityDimension implements CapacityDimension {
  public readonly __brand = 'CapacityDimension';

  constructor(
    public readonly id: string,
    public readonly capacityName: string,
    public readonly capacityType: string,
    public readonly uuid: UUID = UUID.randomUUID(),
  ) {}
}

export class CapabilityWeightDimension
  implements WeightDimension<CapabilityCapacityDimension>
{
  constructor(
    public readonly name: string,
    public readonly type: string,
  ) {}

  public isSatisfiedBy = (capacityDimension: CapabilityCapacityDimension) =>
    capacityDimension.capacityName === this.name &&
    capacityDimension.capacityType === this.type;
}

export class CapabilityTimedCapacityDimension implements CapacityDimension {
  public readonly __brand = 'CapacityDimension';

  constructor(
    public readonly id: string,
    public readonly capacityName: string,
    public readonly capacityType: string,
    public readonly timeSlot: TimeSlot,
    public readonly uuid: UUID = UUID.randomUUID(),
  ) {}
}

export class CapabilityTimedWeightDimension
  implements WeightDimension<CapabilityTimedCapacityDimension>
{
  constructor(
    public readonly name: string,
    public readonly type: string,
    public readonly timeSlot: TimeSlot,
  ) {}

  public isSatisfiedBy = (
    capacityTimedDimension: CapabilityTimedCapacityDimension,
  ) =>
    capacityTimedDimension.capacityName === this.name &&
    capacityTimedDimension.capacityType === this.type &&
    this.timeSlot.within(capacityTimedDimension.timeSlot);
}
