import type { Brand } from '../utils/typing';

export interface CapacityDimension
  extends Brand<unknown, 'CapacityDimension'> {}

export interface WeightDimension<
  T extends CapacityDimension = CapacityDimension,
> {
  isSatisfiedBy(capacityDimension: T): boolean;
}
