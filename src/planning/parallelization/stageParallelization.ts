import { GraphTopologicalSort, Nodes, SortedNodes } from '#sorter';
import type { ObjectSet } from '#utils';
import { ParallelStagesList } from './parallelStagesList';
import { SortedNodesToParallelizedStages } from './sortedNodesToParallelizedStages';
import type { Stage } from './stage';
import { StagesToNodes } from './stagesToNodes';

export const StageParallelization = {
  of: (stages: ObjectSet<Stage>): ParallelStagesList => {
    const nodes: Nodes<Stage> = StagesToNodes.calculate(stages);
    const sortedNodes: SortedNodes<Stage> = GraphTopologicalSort.sort(nodes);
    return SortedNodesToParallelizedStages.calculate(sortedNodes);
  },
};
