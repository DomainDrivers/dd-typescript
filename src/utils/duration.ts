import type { UTCDate } from '@date-fns/utc';
import { differenceInMilliseconds, type Interval } from 'date-fns';
import type { Flavour } from './typing';

export type Duration = Flavour<number, 'Duration'>;

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;

const between = (from: UTCDate, to: UTCDate): Duration =>
  differenceInMilliseconds(to, from) as Duration;

const fromInterval = (interval: Interval): Duration =>
  differenceInMilliseconds(interval.start, interval.end) as Duration;

const compare = (left: Duration, right: Duration): number => left - right;

export const Duration = {
  second,
  minute,
  hour,
  day,
  zero: 0 as Duration,
  ofDays: (days: number): Duration => days * day,
  ofHours: (hours: number): Duration => hours * hour,
  ofMinutes: (hours: number): Duration => hours * hour,
  toDays: (duration: Duration): number => duration / day,
  toHours: (duration: Duration): number => duration / hour,
  toMinutes: (duration: Duration): number => duration / minute,
  between,
  fromInterval,
  compare,
};
