import { SegmentInMinutes, Segments, slotToSegments } from '#availability';
import { TimeSlot } from '#shared';
import { UTCDate } from '@date-fns/utc';
import { isEqual } from 'date-fns';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { assertIsNotNull } from '../../asserts';

void describe('Segments', () => {
  const FIFTEEN_MINUTES_SEGMENT_DURATION = 15;

  void it('Unit has to be multiple of default slot duration in minutes', () => {
    //expect
    assert.throws(() =>
      SegmentInMinutes.of(20, FIFTEEN_MINUTES_SEGMENT_DURATION),
    );
    assert.throws(() =>
      SegmentInMinutes.of(18, FIFTEEN_MINUTES_SEGMENT_DURATION),
    );
    assert.throws(() =>
      SegmentInMinutes.of(7, FIFTEEN_MINUTES_SEGMENT_DURATION),
    );
    assertIsNotNull(SegmentInMinutes.of(15, FIFTEEN_MINUTES_SEGMENT_DURATION));
    assertIsNotNull(SegmentInMinutes.of(30, FIFTEEN_MINUTES_SEGMENT_DURATION));
    assertIsNotNull(SegmentInMinutes.of(45, FIFTEEN_MINUTES_SEGMENT_DURATION));
  });

  void it('Splitting into segments when there is no leftover', () => {
    //given
    const start = new UTCDate('2023-09-09T00:00:00Z');
    const end = new UTCDate('2023-09-09T01:00:00Z');
    const timeSlot = new TimeSlot(start, end);

    //when
    const segments = Segments.split(
      timeSlot,
      SegmentInMinutes.of(15, FIFTEEN_MINUTES_SEGMENT_DURATION),
    );

    //then
    assert.equal(4, segments.length);
    assert.ok(isEqual(new UTCDate('2023-09-09T00:00:00Z'), segments[0].from));
    assert.ok(isEqual(new UTCDate('2023-09-09T00:15:00Z'), segments[0].to));
    assert.ok(isEqual(new UTCDate('2023-09-09T00:15:00Z'), segments[1].from));
    assert.ok(isEqual(new UTCDate('2023-09-09T00:30:00Z'), segments[1].to));
    assert.ok(isEqual(new UTCDate('2023-09-09T00:30:00Z'), segments[2].from));
    assert.ok(isEqual(new UTCDate('2023-09-09T00:45:00Z'), segments[2].to));
    assert.ok(isEqual(new UTCDate('2023-09-09T00:45:00Z'), segments[3].from));
    assert.ok(isEqual(new UTCDate('2023-09-09T01:00:00Z'), segments[3].to));
  });

  void it('Splitting into segments just normalizes if chosen segment larger than passed slot', () => {
    //given
    const start = new UTCDate('2023-09-09T00:10:00Z');
    const end = new UTCDate('2023-09-09T01:00:00Z');
    const timeSlot = new TimeSlot(start, end);

    //when
    const segments = Segments.split(
      timeSlot,
      SegmentInMinutes.of(90, FIFTEEN_MINUTES_SEGMENT_DURATION),
    );

    //then
    assert.equal(segments.length, 1);
    assert.ok(isEqual(new UTCDate('2023-09-09T00:00:00Z'), segments[0].from));
    assert.ok(isEqual(new UTCDate('2023-09-09T01:30:00Z'), segments[0].to));
  });

  void it('Normalizing a time slot', () => {
    //given
    const start = new UTCDate('2023-09-09T00:10:00Z');
    const end = new UTCDate('2023-09-09T01:00:00Z');
    const timeSlot = new TimeSlot(start, end);

    //when
    const segment = Segments.normalizeToSegmentBoundaries(
      timeSlot,
      SegmentInMinutes.of(90, FIFTEEN_MINUTES_SEGMENT_DURATION),
    );

    //then
    assert.ok(isEqual(new UTCDate('2023-09-09T00:00:00Z'), segment.from));
    assert.ok(isEqual(new UTCDate('2023-09-09T01:30:00Z'), segment.to));
  });

  void it('slots are normalized before splitting', () => {
    //given
    const start = new UTCDate('2023-09-09T00:10:00Z');
    const end = new UTCDate('2023-09-09T00:59:00Z');
    const timeSlot = new TimeSlot(start, end);
    const oneHour = SegmentInMinutes.of(60, FIFTEEN_MINUTES_SEGMENT_DURATION);

    //when
    const segments = Segments.split(timeSlot, oneHour);

    //then
    assert.equal(segments.length, 1);
    assert.ok(isEqual(new UTCDate('2023-09-09T00:00:00Z'), segments[0].from));
    assert.ok(isEqual(new UTCDate('2023-09-09T01:00:00Z'), segments[0].to));
  });

  void it('splitting into segments without mormalization', () => {
    //given
    const start = new UTCDate('2023-09-09T00:00:00Z');
    const end = new UTCDate('2023-09-09T00:59:00Z');
    const timeSlot = new TimeSlot(start, end);

    //when
    const segments = slotToSegments(
      timeSlot,
      SegmentInMinutes.of(30, FIFTEEN_MINUTES_SEGMENT_DURATION),
    );

    //then
    assert.equal(segments.length, 2);

    assert.ok(isEqual(new UTCDate('2023-09-09T00:00:00Z'), segments[0].from));
    assert.ok(isEqual(new UTCDate('2023-09-09T00:30:00Z'), segments[0].to));
    assert.ok(isEqual(new UTCDate('2023-09-09T00:30:00Z'), segments[1].from));
    assert.ok(isEqual(new UTCDate('2023-09-09T00:59:00Z'), segments[1].to));
  });
});
