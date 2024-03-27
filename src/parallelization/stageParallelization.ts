import { ParallelStages } from '../planning';
import { ParallelStagesList } from './parallelStagesList';
import { containsAll, except, type Stage } from './stage';

const createSortedNodesRecursively = (
  remainingNodes: Set<Stage>,
  accumulatedSortedNodes: ParallelStagesList,
): ParallelStagesList => {
  const alreadyProcessedNodes: Stage[] = accumulatedSortedNodes.all.flatMap(
    (n) => [...n.stages],
  );

  const nodesWithoutDependencies: Set<Stage> = withAllDependenciesPresentIn(
    remainingNodes,
    alreadyProcessedNodes,
  );

  if (nodesWithoutDependencies.size === 0) {
    return accumulatedSortedNodes;
  }

  const newSortedNodes: ParallelStagesList = accumulatedSortedNodes.add(
    new ParallelStages(nodesWithoutDependencies),
  );
  const newRemainingNodes = except(remainingNodes, nodesWithoutDependencies);
  return createSortedNodesRecursively(newRemainingNodes, newSortedNodes);
};

const withAllDependenciesPresentIn = (
  toCheck: Set<Stage>,
  presentIn: Stage[],
): Set<Stage> => {
  return new Set(
    [...toCheck].filter((n) => containsAll(presentIn, n.dependencies)),
  );
};

export const StageParallelization = {
  of: (stages: Set<Stage>): ParallelStagesList => {
    return createSortedNodesRecursively(stages, ParallelStagesList.empty());
  },
};
