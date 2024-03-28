import type { ObjectSet } from '../../utils';
import type { Stage } from '../parallelization';

export class ParallelStages {
  public constructor(public readonly stages: ObjectSet<Stage>) {}

  public print() {
    return [...this.stages]
      .map((stage) => stage.name)
      .sort()
      .join(', ');
  }
}
