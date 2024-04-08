import { UTCDate } from '@date-fns/utc';

export interface Clock {
  now: () => UTCDate;
}

type WithFixed = { fixed: (date: UTCDate) => Clock };

export const Clock: Clock & WithFixed = {
  fixed: (date: UTCDate): Clock => {
    return {
      now: () => date,
    };
  },
  now: () => new UTCDate(),
};
