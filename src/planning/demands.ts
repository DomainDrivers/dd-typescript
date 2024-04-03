import type { Capability } from '#shared';
import { ObjectMap } from '#utils';

export class Demand {
  constructor(public readonly capability: Capability) {}

  public static demandFor = (capability: Capability): Demand => {
    return new Demand(capability);
  };
}

export class Demands {
  constructor(public readonly all: Demand[]) {}

  public static none = () => new Demands([]);

  public static of = (...demands: Demand[]) => new Demands(demands);

  public add = (demands: Demands) => new Demands([...this.all, ...demands.all]);
}

export class DemandsPerStage {
  constructor(public readonly demands: ObjectMap<string, Demands>) {}

  public static empty = () => new DemandsPerStage(ObjectMap.empty());
}
