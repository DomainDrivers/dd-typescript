import { type CapacityDimension } from './dimension';

export class TotalCapacity {
  constructor(private readonly _capacities: CapacityDimension[]) {}

  public static of = (...capacities: CapacityDimension[]) =>
    new TotalCapacity(capacities);

  public static zero = (): TotalCapacity => {
    return new TotalCapacity([]);
  };

  public get size() {
    return this._capacities.length;
  }

  public get capacities() {
    return [...this._capacities];
  }

  public add(capacities: CapacityDimension[]): TotalCapacity {
    const newCapacities = [...this._capacities, ...capacities];
    return new TotalCapacity(newCapacities);
  }
}
