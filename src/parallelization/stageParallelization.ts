import { ParallelStagesList } from './parallelStagesList';
import type { Stage } from './stage';

export const StageParallelization = {
  of(_stages: Set<Stage>): ParallelStagesList {
    return ParallelStagesList.empty();
  },
};
