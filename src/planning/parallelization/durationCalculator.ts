import { Duration, ObjectMap, ObjectSet, compareDuration } from '#utils';
import type { ParallelStages } from './parallelStages';
import { Stage } from './stage';
import { StageParallelization } from './stageParallelization';

export const DurationCalculator = {
  calculate: (stages: Stage[]): Duration => {
    const parallelizedStages = new StageParallelization().of(
      ObjectSet.from(stages),
    );
    const durations = ObjectMap.from(
      stages.map((stage) => [stage, stage.duration]),
    );
    return parallelizedStages
      .allSorted()
      .map((parallelStages: ParallelStages) => {
        const sorted = parallelStages.stages
          .map((stage) => durations.get(stage)!)
          .sort(compareDuration);

        return sorted.length > 0 ? sorted[sorted.length - 1] : Duration.zero;
      })
      .reduce((a, b) => a + b, Duration.zero);
  },
};
