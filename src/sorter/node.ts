import { ObjectSet } from '../utils';
import { Nodes } from './nodes';

export class Node<T> {
  public readonly dependencies: Nodes<T>;
  public readonly content: T | null = null;

  constructor(
    public readonly name: string,
    dependencies?: Nodes<T>,
    content?: T | null,
  ) {
    this.dependencies =
      dependencies ?? new Nodes<T>(ObjectSet.empty<Node<T>>());
    this.content = content ?? null;
  }

  public dependsOn = (node: Node<T>) =>
    new Node<T>(this.name, this.dependencies.add(node), this.content);

  public toString = () => this.name;

  public equals = (node: Node<T>) => this.name === node.name;
}
