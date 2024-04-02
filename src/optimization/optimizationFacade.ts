import BigNumber from 'bignumber.js';
import { type CapacityDimension } from '.';
import { ObjectMap } from '../utils/objectMap';
import { ObjectSet } from '../utils/objectSet';
import { Item } from './item';
import { Result } from './result';
import type { TotalCapacity } from './totalCapacity';
import { TotalWeight } from './totalWeight';

export const compareItemValueReversed: (a: Item, b: Item) => number = (a, b) =>
  b.value.comparedTo(a.value);

export class OptimizationFacade {
  calculate = (
    items: Item[],
    totalCapacity: TotalCapacity,
    comparer: (a: Item, b: Item) => number = compareItemValueReversed,
  ): Result => {
    const capacitiesSize = totalCapacity.size;
    const dp = new Array<BigNumber>(capacitiesSize + 1).fill(new BigNumber(0));
    const chosenItemsList = new Array<Item[]>(capacitiesSize + 1).fill([]);
    const allocatedCapacitiesList = new Array<ObjectSet<CapacityDimension>>(
      capacitiesSize + 1,
    ).fill(ObjectSet.empty<CapacityDimension>());

    const automaticallyIncludedItems = items.filter((item) =>
      item.isWeightZero(),
    );
    const guaranteedValue = automaticallyIncludedItems.reduce(
      (prev, cur) => prev.plus(cur.value),
      new BigNumber(0),
    );

    const allCapacities = ObjectSet.from(totalCapacity.capacities);
    const itemToCapacitiesMap = ObjectMap.empty<
      Item,
      ObjectSet<CapacityDimension>
    >();

    for (const item of items.sort(comparer)) {
      const chosenCapacities: CapacityDimension[] = this.matchCapacities(
        item.totalWeight,
        allCapacities,
      );
      allCapacities.deleteAll(chosenCapacities);

      if (chosenCapacities.length === 0) {
        continue;
      }

      const sumValue = item.value;
      const chosenCapacitiesCount = chosenCapacities.length;

      for (let j = capacitiesSize; j >= chosenCapacitiesCount; j--) {
        if (dp[j].lt(sumValue.plus(dp[j - chosenCapacitiesCount]))) {
          dp[j] = sumValue.plus(dp[j - chosenCapacitiesCount]);

          chosenItemsList[j] = [...chosenItemsList[j - chosenCapacitiesCount]];
          chosenItemsList[j].push(item);

          allocatedCapacitiesList[j].pushAll(chosenCapacities);
        }
      }
      itemToCapacitiesMap.set(item, ObjectSet.from(chosenCapacities));
    }

    chosenItemsList[capacitiesSize] = [
      ...chosenItemsList[capacitiesSize],
      ...automaticallyIncludedItems,
    ];
    return new Result(
      dp[capacitiesSize].plus(guaranteedValue),
      chosenItemsList[capacitiesSize],
      itemToCapacitiesMap,
    );
  };

  private matchCapacities = (
    totalWeight: TotalWeight,
    availableCapacities: ObjectSet<CapacityDimension>,
  ): CapacityDimension[] => {
    const result: CapacityDimension[] = [];
    for (const weightComponent of totalWeight.components) {
      const matchingCapacity =
        availableCapacities.find((c) => weightComponent.isSatisfiedBy(c)) ??
        null;

      if (matchingCapacity != null) {
        result.push(matchingCapacity);
      } else {
        return [];
      }
    }
    return result;
  };
}
