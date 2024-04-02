import { UTCDate } from '@date-fns/utc';
import {
  addMilliseconds,
  differenceInMilliseconds,
  isAfter,
  isBefore,
  isEqual,
} from 'date-fns';
import { type Duration } from '../../utils';

export class TimeSlot {
  constructor(
    public readonly from: UTCDate,
    public readonly to: UTCDate,
  ) {}

  public static empty = () => new TimeSlot(new UTCDate(0), new UTCDate(0));

  public overlapsWith = (other: TimeSlot) =>
    !isAfter(this.from, other.to) && !isBefore(this.to, other.from);

  public commonPartWith = (other: TimeSlot): TimeSlot => {
    if (!this.overlapsWith(other)) {
      return TimeSlot.empty();
    }
    const commonStart = isAfter(this.from, other.from) ? this.from : other.from;
    const commonEnd = isBefore(this.to, other.to) ? this.to : other.to;
    return new TimeSlot(commonStart, commonEnd);
  };

  public isEmpty = () => isEqual(this.from, this.to);

  public equals = (other: TimeSlot) =>
    isEqual(this.from, other.from) && isEqual(this.to, other.to);

  public duration = (): Duration =>
    differenceInMilliseconds(this.to, this.from);

  public stretch = (duration: Duration) => {
    return new TimeSlot(
      addMilliseconds(this.from, -duration),
      addMilliseconds(this.to, duration),
    );
  };
}
