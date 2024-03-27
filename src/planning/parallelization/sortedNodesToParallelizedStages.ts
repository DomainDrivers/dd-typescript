import { ParallelStages } from '..';
import { SortedNodes } from '../../sorter/sortedNodes';
import { ObjectSet } from '../../utils/objectSet';
import { ParallelStagesList } from './parallelStagesList';
import { Stage } from './stage';

export const SortedNodesToParallelizedStages = {
  calculate: (sortedNodes: SortedNodes): ParallelStagesList => {
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
