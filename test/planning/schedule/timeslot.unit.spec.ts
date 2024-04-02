/* eslint-disable @typescript-eslint/no-floating-promises */

import { UTCDate } from '@date-fns/utc';
import { isEqual } from 'date-fns';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { TimeSlot } from '../../../src/planning/schedule';
import { Duration } from '../../../src/utils';

describe('TimeSlot', () => {
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
