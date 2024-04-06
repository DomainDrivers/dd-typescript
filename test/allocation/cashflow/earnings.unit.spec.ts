/* eslint-disable @typescript-eslint/no-floating-promises */
import { Cost, Earnings, Income } from '#allocation';
import BigNumber from 'bignumber.js';
import assert from 'node:assert';
import { describe, it } from 'node:test';

describe('Earnings', () => {
  const TEN = new BigNumber(10);

  it('income minus cost test', () => {
    //expect
    assert.ok(Earnings.of(9).isEqualTo(Income.of(TEN).minus(Cost.of(1))));
    assert.ok(Earnings.of(8).isEqualTo(Income.of(TEN).minus(Cost.of(2))));
    assert.ok(Earnings.of(7).isEqualTo(Income.of(TEN).minus(Cost.of(3))));
    assert.ok(Earnings.of(-70).isEqualTo(Income.of(100).minus(Cost.of(170))));
  });

  it('income minus cost test', () => {
    //expect
    assert.ok(Earnings.of(10).isGreaterThan(Earnings.of(9)));
    assert.ok(Earnings.of(10).isGreaterThan(Earnings.of(0)));
    assert.ok(Earnings.of(10).isGreaterThan(Earnings.of(-1)));
    assert.ok(!Earnings.of(10).isGreaterThan(Earnings.of(10)));
    assert.ok(!Earnings.of(10).isGreaterThan(Earnings.of(11)));
  });
});
