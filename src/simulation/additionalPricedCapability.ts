import type BigNumber from 'bignumber.js';
import type { AvailableResourceCapability } from './availableResourceCapability';

export class AdditionalPricedCapability {
  constructor(
    public readonly value: BigNumber,
    public readonly availableResourceCapability: AvailableResourceCapability,
  ) {}
}
