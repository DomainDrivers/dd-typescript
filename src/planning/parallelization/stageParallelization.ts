import { Edge, GraphTopologicalSort, Nodes, SortedNodes } from '#sorter';
import type { ObjectSet } from '#utils';
import { feedbackArcSeOnGraph } from '../../sorter/feedbackArcSeOnGraph';
import type { ParallelStagesList } from './parallelStagesList';
import { SortedNodesToParallelizedStages } from './sortedNodesToParallelizedStages';
import type { Stage } from './stage';
import { stagesToNodes } from './stagesToNodes';

export class StageParallelization {
  public of = (stages: ObjectSet<Stage>): ParallelStagesList => {
    const nodes: Nodes<Stage> = stagesToNodes(stages);
    const sortedNodes: SortedNodes<Stage> = GraphTopologicalSort.sort(nodes);
    return SortedNodesToParallelizedStages.calculate(sortedNodes);
  };

  public whatToRemove = (stages: ObjectSet<Stage>): RemovalSuggestion => {
    const nodes = stagesToNodes(stages);
    const result = feedbackArcSeOnGraph<Stage>(nodes.all());
    return new RemovalSuggestion(result);
  };
}

export class RemovalSuggestion {
  constructor(public readonly edges: Edge[]) {}

  public toString(): string {
    return `[${this.edges.join(', ')}]`;
  }
}
