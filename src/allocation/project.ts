import type { TimeSlot } from '#shared';
import type BigNumber from 'bignumber.js';
import type { AllocatedCapability } from './allocatedCapability';
import { Allocations } from './allocations';
import type { Demands } from './demands';

export class Project {
  private allocations: Allocations;

  constructor(
    private demands: Demands,
    public earnings: BigNumber,
  ) {
    this.allocations = Allocations.none();
  }

  public missingDemands = (): Demands =>
    this.demands.missingDemands(this.allocations);

  public remove = (
    capability: AllocatedCapability,
    forSlot: TimeSlot,
  ): AllocatedCapability | null => {
    const toRemove = this.allocations.find(capability.allocatedCapabilityID);
    if (toRemove == null) {
      return null;
    }
    this.allocations = this.allocations.remove(
      capability.allocatedCapabilityID,
      forSlot,
    );
    return toRemove;
  };

  public add = (allocatedCapability: AllocatedCapability): Allocations => {
    this.allocations = this.allocations.add(allocatedCapability);
    return this.allocations;
  };
}
