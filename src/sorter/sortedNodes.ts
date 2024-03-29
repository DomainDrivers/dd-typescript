import { Nodes } from './nodes';

export class SortedNodes<T> {
  constructor(public readonly all: Nodes<T>[]) {}

  public static empty = <T>() => new SortedNodes<T>([]);

  public add = (newNodes: Nodes<T>): SortedNodes<T> => {
    const result = [...this.all, newNodes];
    return new SortedNodes(result);
  };

  public toString = () => 'SortedNodes: ' + JSON.stringify(this.all);
}
