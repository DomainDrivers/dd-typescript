import { deepEquals } from '../utils';
import { Allocations } from './allocations';
import type { Demand } from './demand';

export class Demands {
  constructor(public readonly all: Demand[]) {}

  public missingDemands = (allocations: Allocations) =>
    new Demands(this.all.filter((d) => !this.satisfiedBy(d, allocations)));

  public satisfiedBy = (d: Demand, allocations: Allocations): boolean =>
    allocations.all.some(
      (ar) =>
        deepEquals(ar.capability, d.capability) && d.slot.within(ar.timeSlot),
    );
}
