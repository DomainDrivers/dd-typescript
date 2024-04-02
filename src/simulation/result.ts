import type BigNumber from 'bignumber.js';
import type { ObjectMap, ObjectSet } from '../utils';
import type { AvailableResourceCapability } from './availableResourceCapability';
import type { SimulatedProject } from './simulatedProject';

export class Result {
  constructor(
    public readonly profit: BigNumber,
    public readonly chosenItems: SimulatedProject[],
    public readonly itemToCapacities: ObjectMap<
      SimulatedProject,
      ObjectSet<AvailableResourceCapability>
    >,
  ) {}

  public toString = () =>
    `Result{profit=${this.profit.toString()}, chosenItems=${JSON.stringify(this.chosenItems)}}`;
}
