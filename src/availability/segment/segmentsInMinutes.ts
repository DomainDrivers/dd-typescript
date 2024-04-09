import { Segments } from './segments';

export class SegmentInMinutes {
  constructor(public readonly value: number) {}

  public static of = (
    minutes: number,
    slotDurationInMinutes: number = Segments.DEFAULT_SEGMENT_DURATION_IN_MINUTES,
  ): SegmentInMinutes => {
    if (minutes <= 0) {
      throw new Error('SegmentInMinutesDuration must be positive');
    }
    if (minutes < slotDurationInMinutes) {
      throw new Error(
        `SegmentInMinutesDuration must be at least ${slotDurationInMinutes} minutes`,
      );
    }
    if (minutes % slotDurationInMinutes != 0) {
      throw new Error(
        `SegmentInMinutesDuration must be a multiple of ${slotDurationInMinutes} minutes`,
      );
    }
    return new SegmentInMinutes(minutes);
  };
}

export const defaultSegment = (): SegmentInMinutes =>
  SegmentInMinutes.of(Segments.DEFAULT_SEGMENT_DURATION_IN_MINUTES);
