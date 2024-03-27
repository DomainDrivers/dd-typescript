import type { Stage } from '../parallelization';

export class ParallelStages {
  public constructor(private readonly stages: Stage[]) {}

  public print() {
    return this.stages
      .map((stage) => stage.name)
      .sort()
      .join(', ');
  }
}
