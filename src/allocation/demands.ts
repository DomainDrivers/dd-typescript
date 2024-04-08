import { Capability, TimeSlot } from '#shared';
import { Allocations } from './allocations';
import { Demand } from './demand';

export class Demands {
  constructor(public readonly all: Demand[]) {}

  public static none = () => new Demands([]);

  public static of = (...demands: Demand[]) => new Demands(demands);

  public static allInSameTimeSlot = (
    slot: TimeSlot,
    ...capabilities: Capability[]
  ) => new Demands(capabilities.map((c) => new Demand(c, slot)));

  public missingDemands = (allocations: Allocations) =>
    new Demands(this.all.filter((d) => !this.satisfiedBy(d, allocations)));

  public satisfiedBy = (d: Demand, allocations: Allocations): boolean =>
    allocations.all.some(
      (ar) =>
        ar.capability.canPerform(d.capability) && d.slot.within(ar.timeSlot),
    );

  public withNew = (newDemands: Demands) =>
    new Demands([...this.all, ...newDemands.all]);
}
