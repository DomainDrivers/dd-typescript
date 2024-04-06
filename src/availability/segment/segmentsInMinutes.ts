import { Segments } from './segments';

export class SegmentInMinutes {
  constructor(public readonly value: number) {}

  public static of = (minutes: number): SegmentInMinutes => {
    if (minutes <= 0) {
      throw new Error('SegmentInMinutesDuration must be positive');
    }
    if (minutes % Segments.DEFAULT_SEGMENT_DURATION_IN_MINUTES != 0) {
      throw new Error('SegmentInMinutesDuration must be a multiple of 15');
    }
    return new SegmentInMinutes(minutes);
  };
}

export const defaultSegment = (): SegmentInMinutes =>
  SegmentInMinutes.of(Segments.DEFAULT_SEGMENT_DURATION_IN_MINUTES);
