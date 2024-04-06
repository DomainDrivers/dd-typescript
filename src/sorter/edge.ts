export class Edge {
  constructor(
    public readonly source: number,
    public readonly target: number,
  ) {}

  public toString = () => `(${this.source} -> ${this.target})`;
}
