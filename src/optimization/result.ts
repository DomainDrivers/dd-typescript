import type { ObjectMap, ObjectSet } from '#utils';
import type BigNumber from 'bignumber.js';
import type { CapacityDimension } from './dimension';
import type { Item } from './item';

export class Result {
  constructor(
    public readonly profit: BigNumber,
    public readonly chosenItems: Item[],
    public readonly itemToCapacities: ObjectMap<
      Item,
      ObjectSet<CapacityDimension>
    >,
  ) {}

  public toString = () =>
    `Result{profit=${this.profit.toString()}, chosenItems=${JSON.stringify(this.chosenItems)}}`;
}
