import { differenceInMilliseconds, type Interval } from 'date-fns';

export type Duration = number & { __brand?: 'Duration' };

export const Duration = {
  zero: 0 as Duration,
  ofDays: (days: number): Duration => days * 24 * 60 * 60 * 1000,
  ofHours: (hours: number): Duration => hours * 60 * 60 * 1000,
};

export const fromInterval = (interval: Interval): Duration =>
  differenceInMilliseconds(interval.start, interval.end) as Duration;

export const compareDuration = (left: Duration, right: Duration): number =>
  left - right;
