import type { ObjectSet } from '#utils';
import type { Stage } from './stage';

export class ParallelStages {
  public constructor(public readonly stages: ObjectSet<Stage>) {}

  public print() {
    return [...this.stages]
      .map((stage) => stage.name)
      .sort()
      .join(', ');
  }
}
