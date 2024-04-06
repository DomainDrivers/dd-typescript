import { TimeSlot } from '#shared';
import { Duration } from '#utils';
import type { UTCDate } from '@date-fns/utc';
import { addMinutes, isBefore } from 'date-fns';
import type { SegmentInMinutes } from './segmentsInMinutes';

export const slotToSegments = (
  timeSlot: TimeSlot,
  duration: SegmentInMinutes,
): TimeSlot[] => {
  const minimalSegment = new TimeSlot(
    timeSlot.from,
    addMinutes(timeSlot.from, duration.value),
  );
  if (timeSlot.within(minimalSegment)) {
    return [minimalSegment];
  }
  const segmentInMinutesDuration = duration.value;
  const numberOfSegments = calculateNumberOfSegments(
    timeSlot,
    segmentInMinutesDuration,
  );

  return Array.from({ length: numberOfSegments }, (_, index) => {
    const start = addMinutes(timeSlot.from, segmentInMinutesDuration * index);
    const end = calculateEnd(segmentInMinutesDuration, start, timeSlot.to);
    return new TimeSlot(start, end);
  });
};

const calculateNumberOfSegments = (
  timeSlot: TimeSlot,
  segmentInMinutesDuration: number,
): number => {
  return Math.ceil(
    Duration.toMinutes(Duration.between(timeSlot.to, timeSlot.from)) /
      segmentInMinutesDuration,
  );
};

const calculateEnd = (
  segmentInMinutesDuration: number,
  currentStart: UTCDate,
  initialEnd: UTCDate,
): UTCDate => {
  const segmentEnd = addMinutes(currentStart, segmentInMinutesDuration);
  if (isBefore(initialEnd, segmentEnd)) {
    return initialEnd;
  }
  return segmentEnd;
};
