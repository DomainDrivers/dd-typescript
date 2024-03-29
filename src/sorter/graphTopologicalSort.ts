import { ObjectSet } from '../utils';
import { Nodes } from './nodes';
import { SortedNodes } from './sortedNodes';

const createSortedNodesRecursively = <T>(
  remainingNodes: Nodes<T>,
  accumulatedSortedNodes: SortedNodes<T>,
): SortedNodes<T> => {
  const alreadyProcessedNodes = ObjectSet.from(
    accumulatedSortedNodes.all.flatMap((n) => n.all()),
  );

  const nodesWithoutDependencies: Nodes<T> =
    remainingNodes.withAllDependenciesPresentIn(alreadyProcessedNodes);

  if (nodesWithoutDependencies.all().length === 0) {
    return accumulatedSortedNodes;
  }
  const newSortedNodes: SortedNodes<T> = accumulatedSortedNodes.add(
    nodesWithoutDependencies,
  );
  remainingNodes = remainingNodes.removeAll([
    ...nodesWithoutDependencies.all(),
  ]);
  return createSortedNodesRecursively(remainingNodes, newSortedNodes);
};

export const GraphTopologicalSort = {
  sort: <T>(nodes: Nodes<T>): SortedNodes<T> =>
    createSortedNodesRecursively<T>(nodes, SortedNodes.empty<T>()),
};
