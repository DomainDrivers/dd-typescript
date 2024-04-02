import { SortedNodes } from '#sorter';
import { ObjectSet } from '#utils';
import { ParallelStages } from './parallelStages';
import { ParallelStagesList } from './parallelStagesList';
import { Stage } from './stage';

export const SortedNodesToParallelizedStages = {
  calculate: (sortedNodes: SortedNodes<Stage>): ParallelStagesList => {
    const parallelized = sortedNodes.all.map(
      (nodes) =>
        new ParallelStages(
          ObjectSet.from(
            <Stage[]>nodes
              .all()
              .map((node) => node.content)
              .filter((c) => c !== null),
          ),
        ),
    );
    return new ParallelStagesList(parallelized);
  },
};
