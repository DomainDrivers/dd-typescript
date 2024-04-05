import {
  Allocations,
  Demands,
  ProjectAllocations,
  ProjectAllocationsId,
} from '.';
import { TimeSlot } from '../shared';
import { ObjectMap } from '../utils';

export class ProjectsAllocationsSummary {
  constructor(
    public readonly timeSlots: ObjectMap<ProjectAllocationsId, TimeSlot>,
    public readonly projectAllocations: ObjectMap<
      ProjectAllocationsId,
      Allocations
    >,
    public readonly demands: ObjectMap<ProjectAllocationsId, Demands>,
  ) {}

  static of = (
    allProjectAllocations: ProjectAllocations[],
  ): ProjectsAllocationsSummary => {
    const timeSlots = ObjectMap.from<ProjectAllocationsId, TimeSlot>(
      allProjectAllocations
        .filter((a) => a.hasTimeSlot())
        .map((a) => [a.id, a.timeSlot]),
    );
    const allocations = ObjectMap.from(
      allProjectAllocations.map((a) => [a.id, a.allocations]),
    );
    const demands = ObjectMap.from(
      allProjectAllocations.map((a) => [a.id, a.demands]),
    );
    return new ProjectsAllocationsSummary(timeSlots, allocations, demands);
  };
}
