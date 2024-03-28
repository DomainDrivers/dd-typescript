/* eslint-disable @typescript-eslint/no-floating-promises */
import { UTCDate } from '@date-fns/utc';
import { isEqual, startOfDay } from 'date-fns';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { TimeSlot } from '../../src/shared';

describe('TimeSlot', () => {
  it('creating monthly time slot at UTC', () => {
    //when
    const january2023 = TimeSlot.createMonthlyTimeSlotAtUTC(2023, 1);

    //then
    assert.ok(isEqual(january2023.from, startOfDay(new UTCDate(2023, 1, 1))));
    assert.ok(isEqual(january2023.to, startOfDay(new UTCDate(2023, 2, 1))));
  });

  it('creating daily time slot at UTC', () => {
    //when
    const specificDay = TimeSlot.createDailyTimeSlotAtUTC(2023, 1, 15);

    //then
    assert.ok(isEqual(specificDay.from, startOfDay(new UTCDate(2023, 1, 15))));
    assert.ok(isEqual(specificDay.to, startOfDay(new UTCDate(2023, 1, 16))));
  });

  it('one slot within another', () => {
    //given
    const slot1 = new TimeSlot(
      new UTCDate('2023-01-02T00:00:00Z'),
      new UTCDate('2023-01-02T23:59:59Z'),
    );
    const slot2 = new TimeSlot(
      new UTCDate('2023-01-01T00:00:00Z'),
      new UTCDate('2023-01-03T00:00:00Z'),
    );
    //expect
    assert.ok(slot1.within(slot2));
    assert.ok(!slot2.within(slot1));
  });

  it('one slot is not within another if they just overlap', () => {
    //given
    const slot1 = new TimeSlot(
      new UTCDate('2023-01-01T00:00:00Z'),
      new UTCDate('2023-01-02T23:59:59Z'),
    );
    const slot2 = new TimeSlot(
      new UTCDate('2023-01-02T00:00:00Z'),
      new UTCDate('2023-01-03T00:00:00Z'),
    );
    //expect
    assert.ok(!slot1.within(slot2));
    assert.ok(!slot2.within(slot1));

    //given
    const slot3 = new TimeSlot(
      new UTCDate('2023-01-02T00:00:00Z'),
      new UTCDate('2023-01-03T23:59:59Z'),
    );
    const slot4 = new TimeSlot(
      new UTCDate('2023-01-01T00:00:00Z'),
      new UTCDate('2023-01-02T23:59:59Z'),
    );
    //expect
    assert.ok(!slot3.within(slot4));
    assert.ok(!slot4.within(slot3));
  });

  it('slot is not within another when they are completely outside', () => {
    //given
    const slot1 = new TimeSlot(
      new UTCDate('2023-01-01T00:00:00Z'),
      new UTCDate('2023-01-01T23:59:59Z'),
    );
    const slot2 = new TimeSlot(
      new UTCDate('2023-01-02T00:00:00Z'),
      new UTCDate('2023-01-03T00:00:00Z'),
    );
    //expect
    assert.ok(!slot1.within(slot2));
  });

  it('slot is not within itself', () => {
    //given
    const slot1 = new TimeSlot(
      new UTCDate('2023-01-01T00:00:00Z'),
      new UTCDate('2023-01-01T23:59:59Z'),
    );
    //expect
    assert.ok(slot1.within(slot1));
  });
});
