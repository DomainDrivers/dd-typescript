import type { Flavour } from '#utils';
import BigNumber from 'bignumber.js';

export type Cost = Flavour<BigNumber, 'Cost'>;

export const Cost = {
  of: (number: number | BigNumber): Cost => new BigNumber(number) as Cost,
};
