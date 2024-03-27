import { Node } from './node';

const createAdjacencyList = (initialNodes: Node[]): Map<number, number[]> => {
  const adjacencyList = new Map<number, number[]>();

  for (let i = 1; i <= initialNodes.length; i++) {
    adjacencyList.set(i, []);
  }

  for (let i = 0; i < initialNodes.length; i++) {
    const dependencies: number[] = [];
    for (const dependency of initialNodes[i].dependencies.all()) {
      dependencies.push(
        initialNodes.findIndex((n) => n.equals(dependency)) + 1,
      );
    }
    adjacencyList.set(i + 1, dependencies);
  }
  return adjacencyList;
};

export const FeedbackArcSeOnGraph = {
  calculate: (initialNodes: Node[]): Edge[] => {
    const adjacencyList: Map<number, number[]> =
      createAdjacencyList(initialNodes);
    const feedbackEdges: Edge[] = [];
    const visited: number[] = [];
    const nodes = adjacencyList.keys();

    for (const i of nodes) {
      const neighbours = adjacencyList.get(i)!;
      if (neighbours.length != 0) {
        visited[i] = 1;
        for (let j = 0; j < neighbours.length; j++) {
          if (visited[neighbours[j]] == 1) {
            feedbackEdges.push(new Edge(i, neighbours[j]));
          } else {
            visited[neighbours[j]] = 1;
          }
        }
      }
    }
    return feedbackEdges;
  },
};

export class Edge {
  constructor(
    public readonly source: number,
    public readonly target: number,
  ) {}

  public equals(edge: Edge): boolean {
    return this.source === edge.source && this.target === edge.target;
  }

  public toString = (): string => {
    return `(${this.source} -> ${this.target})`;
  };
}
