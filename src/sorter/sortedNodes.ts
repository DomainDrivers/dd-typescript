import { Nodes } from './nodes';

export class SortedNodes<T> {
  constructor(public readonly all: Nodes<T>[]) {}

  public static empty = <T>(): SortedNodes<T> => {
    return new SortedNodes([]);
  };

  public add = (newNodes: Nodes<T>): SortedNodes<T> => {
    const result = [...this.all, newNodes];
    return new SortedNodes(result);
  };

  public toString = () => {
    return 'SortedNodes: ' + JSON.stringify(this.all);
  };
}
