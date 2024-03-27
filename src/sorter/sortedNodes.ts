import { Nodes } from './nodes';

export class SortedNodes {
  constructor(public readonly all: Nodes[]) {}

  public static empty = (): SortedNodes => {
    return new SortedNodes([]);
  };

  public add = (newNodes: Nodes): SortedNodes => {
    const result = [...this.all, newNodes];
    return new SortedNodes(result);
  };

  public toString = () => {
    return 'SortedNodes: ' + JSON.stringify(this.all);
  };
}
