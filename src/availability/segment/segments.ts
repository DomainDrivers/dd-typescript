import { TimeSlot } from '#shared';
import type { SegmentInMinutes } from './segmentsInMinutes';
import { slotToNormalizedSlot } from './slotToNormalizedSlot';
import { slotToSegments } from './slotToSegments';

export class Segments {
  public static readonly DEFAULT_SEGMENT_DURATION_IN_MINUTES = 15;

  public static split = (
    timeSlot: TimeSlot,
    unit: SegmentInMinutes,
  ): TimeSlot[] => {
    const normalizedSlot = Segments.normalizeToSegmentBoundaries(
      timeSlot,
      unit,
    );
    return slotToSegments(normalizedSlot, unit);
  };

  public static normalizeToSegmentBoundaries = (
    timeSlot: TimeSlot,
    unit: SegmentInMinutes,
  ): TimeSlot => {
    return slotToNormalizedSlot(timeSlot, unit);
  };
}
