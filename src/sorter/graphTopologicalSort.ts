import { ObjectSet } from '../utils/objectSet';
import { Nodes } from './nodes';
import { SortedNodes } from './sortedNodes';

const createSortedNodesRecursively = (
  remainingNodes: Nodes,
  accumulatedSortedNodes: SortedNodes,
): SortedNodes => {
  const alreadyProcessedNodes = ObjectSet.from(
    accumulatedSortedNodes.all.flatMap((n) => n.all()),
  );

  const nodesWithoutDependencies: Nodes =
    remainingNodes.withAllDependenciesPresentIn(alreadyProcessedNodes);

  if (nodesWithoutDependencies.all().length === 0) {
    return accumulatedSortedNodes;
  }
  const newSortedNodes: SortedNodes = accumulatedSortedNodes.add(
    nodesWithoutDependencies,
  );
  remainingNodes = remainingNodes.removeAll([
    ...nodesWithoutDependencies.all(),
  ]);
  return createSortedNodesRecursively(remainingNodes, newSortedNodes);
};

export const GraphTopologicalSort = {
  sort: (nodes: Nodes): SortedNodes =>
    createSortedNodesRecursively(nodes, SortedNodes.empty()),
};
