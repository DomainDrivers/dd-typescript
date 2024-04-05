import type { Flavour } from '#utils';
import BigNumber from 'bignumber.js';

export type Earnings = Flavour<BigNumber, 'Earnings'>;

export const Earnings = {
  of: (number: number | BigNumber): Earnings =>
    new BigNumber(number) as Earnings,
};
