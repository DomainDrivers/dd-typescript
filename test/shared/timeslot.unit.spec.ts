/* eslint-disable @typescript-eslint/no-floating-promises */
import { TimeSlot } from '#shared';
import { Duration, ObjectSet } from '#utils';
import { UTCDate } from '@date-fns/utc';
import { isEqual, startOfDay } from 'date-fns';
import assert from 'node:assert';
import { describe, it } from 'node:test';

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

  it('slots overlapping', () => {
    //given
    const slot1 = new TimeSlot(
      new UTCDate('2022-01-01T00:00:00Z'),
      new UTCDate('2022-01-10T00:00:00Z'),
    );
    const slot2 = new TimeSlot(
      new UTCDate('2022-01-05T00:00:00Z'),
      new UTCDate('2022-01-15T00:00:00Z'),
    );
    const slot3 = new TimeSlot(
      new UTCDate('2022-01-10T00:00:00Z'),
      new UTCDate('2022-01-20T00:00:00Z'),
    );
    const slot4 = new TimeSlot(
      new UTCDate('2022-01-05T00:00:00Z'),
      new UTCDate('2022-01-10T00:00:00Z'),
    );
    const slot5 = new TimeSlot(
      new UTCDate('2022-01-01T00:00:00Z'),
      new UTCDate('2022-01-10T00:00:00Z'),
    );

    //expect
    assert.ok(slot1.overlapsWith(slot2));
    assert.ok(slot1.overlapsWith(slot1));
    assert.ok(slot1.overlapsWith(slot3));
    assert.ok(slot1.overlapsWith(slot4));
    assert.ok(slot1.overlapsWith(slot5));
  });

  it('slots not overlapping', () => {
    //given
    const slot1 = new TimeSlot(
      new UTCDate('2022-01-01T00:00:00Z'),
      new UTCDate('2022-01-10T00:00:00Z'),
    );
    const slot2 = new TimeSlot(
      new UTCDate('2022-01-10T01:00:00Z'),
      new UTCDate('2022-01-20T00:00:00Z'),
    );
    const slot3 = new TimeSlot(
      new UTCDate('2022-01-11T00:00:00Z'),
      new UTCDate('2022-01-20T00:00:00Z'),
    );

    //expect
    assert.ok(!slot1.overlapsWith(slot2));
    assert.ok(!slot1.overlapsWith(slot3));
  });

  it('removing common parts should have no effect when there is no overlap', () => {
    //given
    const slot1 = new TimeSlot(
      new UTCDate('2022-01-01T00:00:00Z'),
      new UTCDate('2022-01-10T00:00:00Z'),
    );
    const slot2 = new TimeSlot(
      new UTCDate('2022-01-15T00:00:00Z'),
      new UTCDate('2022-01-20T00:00:00Z'),
    );

    //expect
    assert.ok(
      ObjectSet.from(slot1.leftoverAfterRemovingCommonWith(slot2)).containsAll([
        slot1,
        slot2,
      ]),
    );
  });

  it('removing common parts when there is full overlap', () => {
    //given
    const slot1 = new TimeSlot(
      new UTCDate('2022-01-01T00:00:00Z'),
      new UTCDate('2022-01-10T00:00:00Z'),
    );

    //expect
    assert.equal(slot1.leftoverAfterRemovingCommonWith(slot1).length, 0);
  });

  it('removing common parts when there is overlap', () => {
    //given
    const slot1 = new TimeSlot(
      new UTCDate('2022-01-01T00:00:00Z'),
      new UTCDate('2022-01-15T00:00:00Z'),
    );
    const slot2 = new TimeSlot(
      new UTCDate('2022-01-10T00:00:00Z'),
      new UTCDate('2022-01-20T00:00:00Z'),
    );

    //when
    const difference = slot1.leftoverAfterRemovingCommonWith(slot2);

    //then
    assert.equal(difference.length, 2);
    assert.ok(isEqual(difference[0].from, new UTCDate('2022-01-01T00:00:00Z')));
    assert.ok(isEqual(difference[0].to, new UTCDate('2022-01-10T00:00:00Z')));
    assert.ok(isEqual(difference[1].from, new UTCDate('2022-01-15T00:00:00Z')));
    assert.ok(isEqual(difference[1].to, new UTCDate('2022-01-20T00:00:00Z')));

    //given
    const slot3 = new TimeSlot(
      new UTCDate('2022-01-05T00:00:00Z'),
      new UTCDate('2022-01-20T00:00:00Z'),
    );
    const slot4 = new TimeSlot(
      new UTCDate('2022-01-01T00:00:00Z'),
      new UTCDate('2022-01-10T00:00:00Z'),
    );

    //when
    const difference2 = slot3.leftoverAfterRemovingCommonWith(slot4);

    //then
    assert.equal(difference2.length, 2);
    assert.ok(
      isEqual(difference2[0].from, new UTCDate('2022-01-01T00:00:00Z')),
    );
    assert.ok(isEqual(difference2[0].to, new UTCDate('2022-01-05T00:00:00Z')));
    assert.ok(
      isEqual(difference2[1].from, new UTCDate('2022-01-10T00:00:00Z')),
    );
    assert.ok(isEqual(difference2[1].to, new UTCDate('2022-01-20T00:00:00Z')));
  });

  it('removing common parts when one slotI in fully within another', () => {
    //given
    const slot1 = new TimeSlot(
      new UTCDate('2022-01-01T00:00:00Z'),
      new UTCDate('2022-01-20T00:00:00Z'),
    );
    const slot2 = new TimeSlot(
      new UTCDate('2022-01-10T00:00:00Z'),
      new UTCDate('2022-01-15T00:00:00Z'),
    );

    //when
    const difference = slot1.leftoverAfterRemovingCommonWith(slot2);

    //then
    assert.equal(difference.length, 2);
    assert.ok(isEqual(difference[0].from, new UTCDate('2022-01-01T00:00:00Z')));
    assert.ok(isEqual(difference[0].to, new UTCDate('2022-01-10T00:00:00Z')));
    assert.ok(isEqual(difference[1].from, new UTCDate('2022-01-15T00:00:00Z')));
    assert.ok(isEqual(difference[1].to, new UTCDate('2022-01-20T00:00:00Z')));
  });
  it('two slots have common part when slots overlap', () => {
    //given
    const slot1 = new TimeSlot(
      new UTCDate('2022-01-01T00:00:00Z'),
      new UTCDate('2022-01-15T00:00:00Z'),
    );
    const slot2 = new TimeSlot(
      new UTCDate('2022-01-10T00:00:00Z'),
      new UTCDate('2022-01-20T00:00:00Z'),
    );

    //when
    const common = slot1.commonPartWith(slot2);

    //then
    assert.ok(!common.isEmpty());
    assert.ok(isEqual(common.from, new UTCDate('2022-01-10T00:00:00Z')));
    assert.ok(isEqual(common.to, new UTCDate('2022-01-15T00:00:00Z')));
  });

  it('two slots have common part when slots overlap', () => {
    //given
    const slot1 = new TimeSlot(
      new UTCDate('2022-01-10T00:00:00Z'),
      new UTCDate('2022-01-20T00:00:00Z'),
    );
    const slot2 = new TimeSlot(
      new UTCDate('2022-01-10T00:00:00Z'),
      new UTCDate('2022-01-20T00:00:00Z'),
    );

    //when
    const common = slot1.commonPartWith(slot2);

    //then
    assert.ok(!common.isEmpty());
    assert.ok(slot1.equals(common));
  });

  it('stretch time slot', () => {
    // Arrange
    const initialFrom = new UTCDate('2022-01-01T10:00:00Z');
    const initialTo = new UTCDate('2022-01-01T12:00:00Z');
    const timeSlot = new TimeSlot(initialFrom, initialTo);

    // Act
    const stretchedSlot = timeSlot.stretch(Duration.ofHours(1));

    // Assert
    assert.ok(isEqual(stretchedSlot.from, new UTCDate('2022-01-01T09:00:00Z')));
    assert.ok(isEqual(stretchedSlot.to, new UTCDate('2022-01-01T13:00:00Z')));
  });
});
