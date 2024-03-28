import type { WeightDimension } from './dimension';

export class TotalWeight {
  constructor(private readonly _components: WeightDimension[]) {}

  public static zero = () => new TotalWeight([]);

  public static of = (...components: WeightDimension[]) =>
    new TotalWeight(components);

  public get components() {
    return [...this._components];
  }
}
