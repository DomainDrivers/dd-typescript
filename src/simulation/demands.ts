import type { Demand } from './demand';

export class Demands {
  constructor(public readonly all: Demand[]) {}

  public static of = (...demands: Demand[]) => new Demands(demands);
}
