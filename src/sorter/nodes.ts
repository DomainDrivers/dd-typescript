import { ObjectSet } from '../utils';
import { Node } from './node';

export class Nodes<T> {
  private readonly nodes: ObjectSet<Node<T>>;

  constructor(nodes: Node<T>[]);
  constructor(nodes: ObjectSet<Node<T>>);
  constructor(nodes: Node<T>[] | ObjectSet<Node<T>>) {
    if (Array.isArray(nodes)) {
      this.nodes = ObjectSet.from(nodes);
    } else {
      this.nodes = nodes;
    }
  }

  all = (): ReadonlyArray<Node<T>> => this.nodes;

  add = (node: Node<T>): Nodes<T> => {
    const newNode = ObjectSet.from([...this.nodes, node]);
    return new Nodes(newNode);
  };

  withAllDependenciesPresentIn = (nodes: ObjectSet<Node<T>>) =>
    new Nodes(
      this.all().filter((n) => nodes.containsAll(n.dependencies.all())),
    );

  removeAll = (nodes: Node<T>[]) => new Nodes(this.nodes.except(nodes));

  public toString = () => `Nodes{node=${JSON.stringify(this.nodes)}}`;
}
