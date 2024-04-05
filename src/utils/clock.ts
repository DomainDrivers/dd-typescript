import { UTCDate } from '@date-fns/utc';

export interface Clock {
  now: () => UTCDate;
}

export const Clock: Clock = {
  now: () => new UTCDate(),
};
