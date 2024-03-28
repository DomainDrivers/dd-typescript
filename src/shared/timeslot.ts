import { UTCDate } from '@date-fns/utc';
import {
  addDays,
  addMonths,
  interval,
  intervalToDuration,
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

  public within = (other: TimeSlot) =>
    !isBefore(this.from, other.from) && !isAfter(this.to, other.to);

  equals = (other: TimeSlot) =>
    isEqual(this.from, other.from) && isEqual(this.to, other.to);

  public duration = () => intervalToDuration(interval(this.from, this.to));
}
