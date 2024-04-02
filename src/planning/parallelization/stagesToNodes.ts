import { Node, Nodes } from '../../sorter';
import { ObjectSet } from '../../utils/objectSet';
import { Stage } from './stage';

export const StagesToNodes = {
  calculate: (stages: Stage[]): Nodes => {
    let result = new Map<string, Node>(
      stages.map((stage) => [
        stage.name,
        new Node(stage.name, undefined, stage),
      ]),
    );

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      result = explicitDependencies(stage, result);
    }

    return new Nodes(ObjectSet.from<Node>([...result.values()]));
  },
};

const explicitDependencies = (
  stage: Stage,
  result: Map<string, Node>,
): Map<string, Node> => {
  let nodeWithExplicitDeps = result.get(stage.name)!;
  for (const explicitDependency of stage.dependencies) {
    nodeWithExplicitDeps = nodeWithExplicitDeps.dependsOn(
      result.get(explicitDependency.name)!,
    );
  }
  result.set(stage.name, nodeWithExplicitDeps);
  return result;
};
