import type { Stage } from '../parallelization';

export class ParallelStages {
  public constructor(public readonly stages: Set<Stage>) {}

  public print() {
    return [...this.stages]
      .map((stage) => stage.name)
      .sort()
      .join(', ');
  }
}
