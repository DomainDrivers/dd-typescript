/* eslint-disable @typescript-eslint/no-floating-promises */
import { SegmentInMinutes, slotToNormalizedSlot } from '#availability';
import { TimeSlot } from '#shared';
import { deepEquals } from '#utils';
import { UTCDate } from '@date-fns/utc';
import { isEqual } from 'date-fns';
import assert from 'node:assert';
import { describe, it } from 'node:test';

describe('SlotToNormalizedSlot', () => {
  it('Has no effect when slot already normalized', () => {
    //given
    const start = new UTCDate('2023-09-09T00:00:00Z');
    const end = new UTCDate('2023-09-09T01:00:00Z');
    const timeSlot = new TimeSlot(start, end);
    const oneHour = SegmentInMinutes.of(60);

    //when
    const normalized = slotToNormalizedSlot(timeSlot, oneHour);

    //then
    assert.ok(deepEquals(timeSlot, normalized));
  });

  it('normalizedToTheHour', () => {
    //given
    const start = new UTCDate('2023-09-09T00:10:00Z');
    const end = new UTCDate('2023-09-09T00:59:00Z');
    const timeSlot = new TimeSlot(start, end);
    const oneHour = SegmentInMinutes.of(60);

    //when
    const normalized = slotToNormalizedSlot(timeSlot, oneHour);

    //then
    assert.ok(isEqual(new UTCDate('2023-09-09T00:00:00Z'), normalized.from));
    assert.ok(isEqual(new UTCDate('2023-09-09T01:00:00Z'), normalized.to));
  });

  it('Normalized when short slot overlapping two segments', () => {
    //given
    const start = new UTCDate('2023-09-09T00:29:00Z');
    const end = new UTCDate('2023-09-09T00:31:00Z');
    const timeSlot = new TimeSlot(start, end);
    const oneHour = SegmentInMinutes.of(60);

    //when
    const normalized = slotToNormalizedSlot(timeSlot, oneHour);

    //then
    assert.ok(isEqual(new UTCDate('2023-09-09T00:00:00Z'), normalized.from));
    assert.ok(isEqual(new UTCDate('2023-09-09T01:00:00Z'), normalized.to));
  });

  it('No normalization when slot starts at segment start', () => {
    //given
    const start = new UTCDate('2023-09-09T00:15:00Z');
    const end = new UTCDate('2023-09-09T00:30:00Z');
    const timeSlot = new TimeSlot(start, end);
    const start2 = new UTCDate('2023-09-09T00:30:00Z');
    const end2 = new UTCDate('2023-09-09T00:45:00Z');
    const timeSlot2 = new TimeSlot(start2, end2);
    const fifteenMinutes = SegmentInMinutes.of(15);

    //when
    const normalized = slotToNormalizedSlot(timeSlot, fifteenMinutes);
    const normalized2 = slotToNormalizedSlot(timeSlot2, fifteenMinutes);

    //then
    assert.ok(isEqual(new UTCDate('2023-09-09T00:15:00Z'), normalized.from));
    assert.ok(isEqual(new UTCDate('2023-09-09T00:30:00Z'), normalized.to));
    assert.ok(isEqual(new UTCDate('2023-09-09T00:30:00Z'), normalized2.from));
    assert.ok(isEqual(new UTCDate('2023-09-09T00:45:00Z'), normalized2.to));
  });
});
