import { BigNumber } from 'bignumber.js';
import type { Demands } from './demands';
import type { ProjectId } from './projectId';

export class SimulatedProject {
  constructor(
    public readonly projectId: ProjectId,
    private readonly value: () => BigNumber,
    public readonly missingDemands: Demands,
  ) {}

  public calculateValue = () => this.value();
}
