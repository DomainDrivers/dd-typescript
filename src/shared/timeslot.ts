import { Duration } from '#utils';
import { UTCDate } from '@date-fns/utc';
import {
  addDays,
  addMilliseconds,
  addMonths,
  differenceInMilliseconds,
  isAfter,
  isBefore,
  isEqual,
  startOfDay,
} from 'date-fns';

export class TimeSlot {
  constructor(
    public readonly from: UTCDate,
    public readonly to: UTCDate,
  ) {}

  public static empty = () => new TimeSlot(new UTCDate(0), new UTCDate(0));

  public static createDailyTimeSlotAtUTC = (
    year: number,
    month: number,
    day: number,
  ): TimeSlot => {
    const thisDay = new UTCDate(year, month, day);
    const from = startOfDay(thisDay);

    return new TimeSlot(from, addDays(from, 1));
  };

  public static createMonthlyTimeSlotAtUTC = (
    year: number,
    month: number,
  ): TimeSlot => {
    const startOfMonth = new UTCDate(year, month, 1);
    const endOfMonth = addMonths(startOfMonth, 1);
    const from = startOfDay(startOfMonth);
    const to = startOfDay(endOfMonth);
    return new TimeSlot(from, to);
  };

  public overlapsWith = (other: TimeSlot) =>
    !isAfter(this.from, other.to) && !isBefore(this.to, other.from);

  public within = (other: TimeSlot) =>
    !isBefore(this.from, other.from) && !isAfter(this.to, other.to);

  public commonPartWith = (other: TimeSlot): TimeSlot => {
    if (!this.overlapsWith(other)) {
      return TimeSlot.empty();
    }
    const commonStart = isAfter(this.from, other.from) ? this.from : other.from;
    const commonEnd = isBefore(this.to, other.to) ? this.to : other.to;
    return new TimeSlot(commonStart, commonEnd);
  };

  public isEmpty = () => isEqual(this.from, this.to);

  public leftoverAfterRemovingCommonWith = (other: TimeSlot): TimeSlot[] => {
    if (this.equals(other)) {
      return [];
    }
    if (!other.overlapsWith(this)) {
      return [this, other];
    }
    const result = [];

    if (isBefore(this.from, other.from)) {
      result.push(new TimeSlot(this.from, other.from));
    }
    if (isBefore(other.from, this.from)) {
      result.push(new TimeSlot(other.from, this.from));
    }
    if (isAfter(this.to, other.to)) {
      result.push(new TimeSlot(other.to, this.to));
    }
    if (isAfter(other.to, this.to)) {
      result.push(new TimeSlot(this.to, other.to));
    }
    return result;
  };

  public stretch = (duration: Duration) => {
    return new TimeSlot(
      addMilliseconds(this.from, -duration),
      addMilliseconds(this.to, duration),
    );
  };

  equals = (other: TimeSlot) =>
    isEqual(this.from, other.from) && isEqual(this.to, other.to);

  public duration = (): Duration =>
    differenceInMilliseconds(this.to, this.from);
}
