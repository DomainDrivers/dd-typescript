import type { Capability, TimeSlot } from '#shared';

export class Demand {
  constructor(
    public readonly capability: Capability,
    public readonly slot: TimeSlot,
  ) {}
}
