import { TimeSlot } from '#shared';
import { UTCDate } from '@date-fns/utc';
import { addMinutes, isAfter, isBefore, roundToNearestHours } from 'date-fns';
import type { SegmentInMinutes } from './segmentsInMinutes';

export const slotToNormalizedSlot = (
  timeSlot: TimeSlot,
  segmentInMinutes: SegmentInMinutes,
): TimeSlot => {
  const segmentInMinutesDuration = segmentInMinutes.value;
  const segmentStart = normalizeStart(timeSlot.from, segmentInMinutesDuration);
  const segmentEnd = normalizeEnd(timeSlot.to, segmentInMinutesDuration);
  const normalized = new TimeSlot(segmentStart, segmentEnd);
  const minimalSegment = new TimeSlot(
    segmentStart,
    addMinutes(segmentStart, segmentInMinutes.value),
  );
  if (normalized.within(minimalSegment)) {
    return minimalSegment;
  }
  return normalized;
};

export const normalizeEnd = (
  initialEnd: UTCDate,
  segmentInMinutesDuration: number,
): UTCDate => {
  let closestSegmentEnd = new UTCDate(
    roundToNearestHours(initialEnd, {
      roundingMethod: 'floor',
    }),
  );
  while (isAfter(initialEnd, closestSegmentEnd)) {
    closestSegmentEnd = addMinutes(closestSegmentEnd, segmentInMinutesDuration);
  }
  return closestSegmentEnd;
};

export const normalizeStart = (
  initialStart: UTCDate,
  segmentInMinutesDuration: number,
): UTCDate => {
  let closestSegmentStart = new UTCDate(
    roundToNearestHours(initialStart, {
      roundingMethod: 'floor',
    }),
  );
  if (
    isAfter(
      addMinutes(closestSegmentStart, segmentInMinutesDuration),
      initialStart,
    )
  ) {
    return closestSegmentStart;
  }
  while (isBefore(closestSegmentStart, initialStart)) {
    closestSegmentStart = addMinutes(
      closestSegmentStart,
      segmentInMinutesDuration,
    );
  }
  return closestSegmentStart;
};
