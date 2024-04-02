import BigNumber from 'bignumber.js';
import { ObjectMap } from '../utils';
import { Result } from './result';
import { SimulatedCapabilities } from './simulatedCapabilities';
import { SimulatedProject } from './simulatedProject';

export class SimulationFacade {
  public whichProjectWithMissingDemandsIsMostProfitableToAllocateResourcesTo = (
    _projects: SimulatedProject[],
    _totalCapability: SimulatedCapabilities,
  ): Result => new Result(new BigNumber(0), [], ObjectMap.empty());
}
