import { ObjectSet } from '../utils/objectSet';
import { Node } from './node';

export class Nodes {
  private readonly nodes: ObjectSet<Node>;

  constructor(nodes: Node[]);
  constructor(nodes: ObjectSet<Node>);
  constructor(nodes: Node[] | ObjectSet<Node>) {
    if (Array.isArray(nodes)) {
      this.nodes = ObjectSet.from(nodes);
    } else {
      this.nodes = nodes;
    }
  }

  all = (): ReadonlyArray<Node> => {
    return this.nodes;
  };

  add = (node: Node): Nodes => {
    const newNode = ObjectSet.from([...this.nodes, node]);
    return new Nodes(newNode);
  };

  withAllDependenciesPresentIn = (nodes: ObjectSet<Node>): Nodes => {
    return new Nodes(
      this.all().filter((n) => nodes.containsAll(n.dependencies.all())),
    );
  };

  removeAll = (nodes: Node[]): Nodes => {
    return new Nodes(this.nodes.except(nodes));
  };

  public toString = (): string => {
    return `Nodes{node=${JSON.stringify(this.nodes)}}`;
  };
}
