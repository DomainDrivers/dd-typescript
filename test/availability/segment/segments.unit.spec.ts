/* eslint-disable @typescript-eslint/no-floating-promises */
import { SegmentInMinutes, Segments, slotToSegments } from '#availability';
import { TimeSlot } from '#shared';
import { UTCDate } from '@date-fns/utc';
import { isEqual } from 'date-fns';
import assert from 'node:assert';
import { describe, it } from 'node:test';

describe('Segments', () => {
  it('Unit has to be multiple of15 minutes', () => {
    //expect
    assert.throws(() => SegmentInMinutes.of(20));
    assert.throws(() => SegmentInMinutes.of(18));
    assert.throws(() => SegmentInMinutes.of(7));
    assert.notEqual(SegmentInMinutes.of(15), null);
    assert.notEqual(SegmentInMinutes.of(30), null);
    assert.notEqual(SegmentInMinutes.of(45), null);
  });

  it('Splitting into segments when there is no leftover', () => {
    //given
    const start = new UTCDate('2023-09-09T00:00:00Z');
    const end = new UTCDate('2023-09-09T01:00:00Z');
    const timeSlot = new TimeSlot(start, end);

    //when
    const segments = Segments.split(timeSlot, SegmentInMinutes.of(15));

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

  it('Splitting into segments just normalizes if chosen segment larger than passed slot', () => {
    //given
    const start = new UTCDate('2023-09-09T00:10:00Z');
    const end = new UTCDate('2023-09-09T01:00:00Z');
    const timeSlot = new TimeSlot(start, end);

    //when
    const segments = Segments.split(timeSlot, SegmentInMinutes.of(90));

    //then
    assert.equal(segments.length, 1);
    assert.ok(isEqual(new UTCDate('2023-09-09T00:00:00Z'), segments[0].from));
    assert.ok(isEqual(new UTCDate('2023-09-09T01:30:00Z'), segments[0].to));
  });

  it('Normalizing a time slot', () => {
    //given
    const start = new UTCDate('2023-09-09T00:10:00Z');
    const end = new UTCDate('2023-09-09T01:00:00Z');
    const timeSlot = new TimeSlot(start, end);

    //when
    const segment = Segments.normalizeToSegmentBoundaries(
      timeSlot,
      SegmentInMinutes.of(90),
    );

    //then
    assert.ok(isEqual(new UTCDate('2023-09-09T00:00:00Z'), segment.from));
    assert.ok(isEqual(new UTCDate('2023-09-09T01:30:00Z'), segment.to));
  });

  it('slots are normalized before splitting', () => {
    //given
    const start = new UTCDate('2023-09-09T00:10:00Z');
    const end = new UTCDate('2023-09-09T00:59:00Z');
    const timeSlot = new TimeSlot(start, end);
    const oneHour = SegmentInMinutes.of(60);

    //when
    const segments = Segments.split(timeSlot, oneHour);

    //then
    assert.equal(segments.length, 1);
    assert.ok(isEqual(new UTCDate('2023-09-09T00:00:00Z'), segments[0].from));
    assert.ok(isEqual(new UTCDate('2023-09-09T01:00:00Z'), segments[0].to));
  });

  it('splitting into segments without mormalization', () => {
    //given
    const start = new UTCDate('2023-09-09T00:00:00Z');
    const end = new UTCDate('2023-09-09T00:59:00Z');
    const timeSlot = new TimeSlot(start, end);

    //when
    const segments = slotToSegments(timeSlot, SegmentInMinutes.of(30));

    //then
    assert.equal(segments.length, 2);

    assert.ok(isEqual(new UTCDate('2023-09-09T00:00:00Z'), segments[0].from));
    assert.ok(isEqual(new UTCDate('2023-09-09T00:30:00Z'), segments[0].to));
    assert.ok(isEqual(new UTCDate('2023-09-09T00:30:00Z'), segments[1].from));
    assert.ok(isEqual(new UTCDate('2023-09-09T00:59:00Z'), segments[1].to));
  });
});
