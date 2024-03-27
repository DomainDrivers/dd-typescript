import type { Stage } from '.';
import type { ObjectSet } from '../../utils/objectSet';

export class ParallelStages {
  public constructor(public readonly stages: ObjectSet<Stage>) {}

  public print() {
    return [...this.stages]
      .map((stage) => stage.name)
      .sort()
      .join(', ');
  }
}
