import { BigNumber } from 'bignumber.js';
import type { Demands } from './demands';
import type { ProjectId } from './projectId';

export class SimulatedProject {
  constructor(
    public readonly projectId: ProjectId,
    public readonly earnings: BigNumber,
    public readonly missingDemands: Demands,
  ) {}

  public allDemandsSatisfied = () => this.missingDemands.all.length === 0;
}
