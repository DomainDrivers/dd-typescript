import { Duration, ObjectSet } from '#utils';
import type { Stage } from './stage';

export class ParallelStages {
  public constructor(public readonly stages: ObjectSet<Stage>) {}

  public print() {
    return [...this.stages]
      .map((stage) => stage.name)
      .sort()
      .join(', ');
  }

  public static of = (...stages: Stage[]): ParallelStages =>
    new ParallelStages(ObjectSet.from(stages));

  public duration = (): Duration => {
    const ordered = this.stages.map((s) => s.duration).sort(Duration.compare);

    return ordered.length > 0 ? ordered[ordered.length - 1] : Duration.zero;
  };
}
