/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  Item,
  OptimizationFacade,
  TotalCapacity,
  TotalWeight,
} from '#optimization';
import BigNumber from 'bignumber.js';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  CapabilityCapacityDimension,
  CapabilityWeightDimension,
} from './capabilityCapacityDimension';

describe('Optimization', () => {
  const facade = new OptimizationFacade();

  it('nothing is chosen when no capacities', () => {
    //given
    const items = [
      new Item(
        'Item1',
        new BigNumber(100),
        TotalWeight.of(new CapabilityWeightDimension('COMMON SENSE', 'Skill')),
      ),
      new Item(
        'Item2',
        new BigNumber(100),
        TotalWeight.of(new CapabilityWeightDimension('THINKING', 'Skill')),
      ),
    ];

    //when
    const result = facade.calculate(items, TotalCapacity.zero());

    //then
    assert.ok(result.profit.eq(0));
    assert.equal(result.chosenItems.length, 0);
  });

  it('everything is chosen when all weights are zero', () => {
    //given
    const items = [
      new Item('Item1', new BigNumber(200), TotalWeight.zero()),
      new Item('Item2', new BigNumber(100), TotalWeight.zero()),
    ];

    //when
    const result = facade.calculate(items, TotalCapacity.zero());

    //then
    assert.ok(result.profit.eq(300));
    assert.equal(result.chosenItems.length, 2);
  });

  it('if enough capacity all items are chosen', () => {
    //given
    const items = [
      new Item(
        'Item1',
        new BigNumber(100),
        TotalWeight.of(
          new CapabilityWeightDimension('WEB DEVELOPMENT', 'Skill'),
        ),
      ),
      new Item(
        'Item2',
        new BigNumber(300),
        TotalWeight.of(
          new CapabilityWeightDimension('WEB DEVELOPMENT', 'Skill'),
        ),
      ),
    ];
    const c1 = new CapabilityCapacityDimension(
      'anna',
      'WEB DEVELOPMENT',
      'Skill',
    );
    const c2 = new CapabilityCapacityDimension(
      'zbyniu',
      'WEB DEVELOPMENT',
      'Skill',
    );

    //when
    const result = facade.calculate(items, TotalCapacity.of(c1, c2));

    //then
    assert.ok(result.profit.eq(400));
    assert.equal(result.chosenItems.length, 2);
  });

  it('most valuable items are chosen', () => {
    //given
    const item1 = new Item(
      'Item1',
      new BigNumber(100),
      TotalWeight.of(new CapabilityWeightDimension('JAVA', 'Skill')),
    );
    const item2 = new Item(
      'Item2',
      new BigNumber(500),
      TotalWeight.of(new CapabilityWeightDimension('JAVA', 'Skill')),
    );
    const item3 = new Item(
      'Item3',
      new BigNumber(300),
      TotalWeight.of(new CapabilityWeightDimension('JAVA', 'Skill')),
    );
    const c1 = new CapabilityCapacityDimension('anna', 'JAVA', 'Skill');
    const c2 = new CapabilityCapacityDimension('zbyniu', 'JAVA', 'Skill');

    //when
    const result = facade.calculate(
      [item1, item2, item3],
      TotalCapacity.of(c1, c2),
    );

    //then
    assert.ok(result.profit.eq(800));
    assert.equal(result.chosenItems.length, 2);

    assert.equal(1, result.itemToCapacities.get(item3)?.length);
    assert.ok(
      result.itemToCapacities.get(item3)?.containsAnyElementsOf([c1, c2]),
    );
    assert.equal(result.itemToCapacities.get(item2)?.length, 1);
    assert.ok(
      result.itemToCapacities.get(item2)?.containsAnyElementsOf([c1, c2]),
    );
    assert.equal(result.itemToCapacities.get(item1), null);
  });
});
