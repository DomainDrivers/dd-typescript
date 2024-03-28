import type BigNumber from 'bignumber.js';
import type { CapacityDimension, Item } from '.';
import type { ObjectMap } from '../utils/objectMap';
import type { ObjectSet } from '../utils/objectSet';

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
