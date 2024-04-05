import type { Brand } from '#utils';
import BigNumber from 'bignumber.js';

export type Income = Brand<BigNumber, 'Income'>;

export const Income = {
  of: (number: number | BigNumber): Income => new BigNumber(number) as Income,
};
