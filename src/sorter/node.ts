import { Stage } from '../planning/parallelization';
import { ObjectSet } from '../utils/objectSet';
import { Nodes } from './nodes';

export class Node {
  public readonly dependencies: Nodes;
  public readonly content: Stage | null = null;

  constructor(
    public readonly name: string,
    dependencies?: Nodes,
    content?: Stage | null,
  ) {
    this.dependencies = dependencies ?? new Nodes(ObjectSet.empty<Node>());
    this.content = content ?? null;
  }

  public dependsOn = (node: Node): Node => {
    return new Node(this.name, this.dependencies.add(node), this.content);
  };

  public toString = (): string => {
    return this.name;
  };

  public equals(Node: Node): boolean {
    return this.name === Node.name;
  }
}
