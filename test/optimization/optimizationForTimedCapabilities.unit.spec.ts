import {
  Item,
  OptimizationFacade,
  TotalCapacity,
  TotalWeight,
} from '#optimization';
import { TimeSlot } from '#shared';
import BigNumber from 'bignumber.js';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  CapabilityTimedCapacityDimension,
  CapabilityTimedWeightDimension,
} from './capabilityCapacityDimension';

void describe('OptimizationForTimedCapabilities', () => {
  const facade = new OptimizationFacade();

  void it('nothing is chosen when no capacities in time slot', () => {
    //given
    const june = TimeSlot.createMonthlyTimeSlotAtUTC(2020, 6);
    const october = TimeSlot.createMonthlyTimeSlotAtUTC(2020, 10);

    const items = [
      new Item(
        'Item1',
        new BigNumber(100),
        TotalWeight.of(
          new CapabilityTimedWeightDimension('COMMON SENSE', 'Skill', june),
        ),
      ),
      new Item(
        'Item2',
        new BigNumber(100),
        TotalWeight.of(
          new CapabilityTimedWeightDimension('THINKING', 'Skill', june),
        ),
      ),
    ];

    //when
    const result = facade.calculate(
      items,
      TotalCapacity.of(
        new CapabilityTimedCapacityDimension(
          'anna',
          'COMMON SENSE',
          'Skill',
          october,
        ),
      ),
    );

    //then
    assert.ok(result.profit.eq(0));
    assert.equal(result.chosenItems.length, 0);
  });

  void it('most profitable item is chosen', () => {
    //given
    const june = TimeSlot.createMonthlyTimeSlotAtUTC(2020, 6);

    const items = [
      new Item(
        'Item1',
        new BigNumber(200),
        TotalWeight.of(
          new CapabilityTimedWeightDimension('COMMON SENSE', 'Skill', june),
        ),
      ),
      new Item(
        'Item2',
        new BigNumber(100),
        TotalWeight.of(
          new CapabilityTimedWeightDimension('THINKING', 'Skill', june),
        ),
      ),
    ];

    //when
    const result = facade.calculate(
      items,
      TotalCapacity.of(
        new CapabilityTimedCapacityDimension(
          'anna',
          'COMMON SENSE',
          'Skill',
          june,
        ),
      ),
    );

    //then
    assert.ok(result.profit.eq(200));
    assert.equal(result.chosenItems.length, 1);
  });
});
