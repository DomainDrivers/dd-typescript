import type { TimeSlot } from '#shared';
import { SimulatedCapabilities, SimulationFacade } from '#simulation';
import type { UUID } from '#utils';
import type BigNumber from 'bignumber.js';
import type { AllocatedCapability } from './allocatedCapability';
import type { Projects } from './projects';

export class AllocationFacade {
  constructor(private readonly simulationFacade: SimulationFacade) {}

  public checkPotentialTransfer = (
    projects: Projects,
    projectFrom: UUID,
    projectTo: UUID,
    capability: AllocatedCapability,
    forSlot: TimeSlot,
  ): BigNumber => {
    //Project rather fetched from db.
    const resultBefore = this.simulationFacade.whatIsTheOptimalSetup(
      projects.toSimulatedProjects(),
      SimulatedCapabilities.none(),
    );
    projects = projects.transfer(projectFrom, projectTo, capability, forSlot);
    const resultAfter = this.simulationFacade.whatIsTheOptimalSetup(
      projects.toSimulatedProjects(),
      SimulatedCapabilities.none(),
    );
    return resultAfter.profit.minus(resultBefore.profit);
  };
}
