import type BigNumber from 'bignumber.js';
import type { TotalWeight } from './totalWeight';

export class Item {
  constructor(
    public readonly name: string,
    public readonly value: BigNumber,
    public readonly totalWeight: TotalWeight,
  ) {}

  isWeightZero = (): boolean => this.totalWeight.components.length === 0;
}
