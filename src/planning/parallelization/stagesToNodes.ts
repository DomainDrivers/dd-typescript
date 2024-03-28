import { Node, Nodes } from '../../sorter';
import { ObjectSet } from '../../utils';
import { Stage } from './stage';

export const StagesToNodes = {
  calculate: (stages: Stage[]): Nodes<Stage> => {
    let result = new Map<string, Node<Stage>>(
      stages.map((stage) => [
        stage.name,
        new Node(stage.name, undefined, stage),
      ]),
    );

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      result = explicitDependencies(stage, result);
      result = sharedResources(stage, stages.slice(i + 1), result);
    }

    return new Nodes(ObjectSet.from<Node<Stage>>([...result.values()]));
  },
};

const sharedResources = (
  stage: Stage,
  withStages: Stage[],
  result: Map<string, Node<Stage>>,
): Map<string, Node<Stage>> => {
  for (const other of withStages) {
    if (stage.name !== other.name) {
      if (
        stage.resources.some((r) =>
          other.resources.some((oth) => oth.name === r.name),
        )
      ) {
        if (other.resources.length > stage.resources.length) {
          let node = result.get(stage.name)!;
          node = node.dependsOn(result.get(other.name)!);
          result.set(stage.name, node);
        } else {
          let node = result.get(other.name)!;
          node = node.dependsOn(result.get(stage.name)!);
          result.set(other.name, node);
        }
      }
    }
  }
  return result;
};

const explicitDependencies = (
  stage: Stage,
  result: Map<string, Node<Stage>>,
): Map<string, Node<Stage>> => {
  let nodeWithExplicitDeps = result.get(stage.name)!;
  for (const explicitDependency of stage.dependencies) {
    nodeWithExplicitDeps = nodeWithExplicitDeps.dependsOn(
      result.get(explicitDependency.name)!,
    );
  }
  result.set(stage.name, nodeWithExplicitDeps);
  return result;
};
