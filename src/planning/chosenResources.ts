import type { ResourceId } from '#availability';
import { TimeSlot } from '#shared';
import { ObjectSet } from '#utils';

export class ChosenResources {
  constructor(
    public readonly resources: ObjectSet<ResourceId>,
    public readonly timeSlot: TimeSlot,
  ) {}

  public static none = () =>
    new ChosenResources(ObjectSet.empty(), TimeSlot.empty());
}
