import { GraphTopologicalSort, Nodes, SortedNodes } from '../../sorter';
import type { ObjectSet } from '../../utils/objectSet';
import { pipe } from '../../utils/pipe';
import { ParallelStagesList } from './parallelStagesList';
import { SortedNodesToParallelizedStages } from './sortedNodesToParallelizedStages';
import { type Stage } from './stage';
import { StagesToNodes } from './stagesToNodes';

const CREATE_NODES = (stages: Stage[]): Nodes<Stage> =>
  StagesToNodes.calculate(stages);
const GRAPH_SORT = (nodes: Nodes<Stage>): SortedNodes<Stage> =>
  GraphTopologicalSort.sort(nodes);
const PARALLELIZE = (nodes: SortedNodes<Stage>) =>
  SortedNodesToParallelizedStages.calculate(nodes);

const WORKFLOW = pipe(CREATE_NODES, GRAPH_SORT, PARALLELIZE);

export const StageParallelization = {
  of: (stages: ObjectSet<Stage>): ParallelStagesList => WORKFLOW(stages),
};
