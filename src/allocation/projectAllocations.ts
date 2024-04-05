import { Capability, TimeSlot } from '#shared';
import { UUID } from '#utils';
import type { UTCDate } from '@date-fns/utc';
import { Allocations, Demands, ProjectAllocationsId, ResourceId } from '.';
import { CapabilitiesAllocated } from './capabilitiesAllocated';
import { CapabilityReleased } from './capabilitiesReleased';

export class ProjectAllocations {
  #projectId: ProjectAllocationsId;
  #allocations: Allocations;
  #demands: Demands;
  #timeSlot: TimeSlot;

  constructor(
    projectId: ProjectAllocationsId,
    allocations: Allocations,
    scheduledDemands: Demands,
    timeSlot: TimeSlot = TimeSlot.empty(),
  ) {
    this.#projectId = projectId;
    this.#allocations = allocations;
    this.#demands = scheduledDemands;
    this.#timeSlot = timeSlot;
  }

  public static empty = (projectId: ProjectAllocationsId) =>
    new ProjectAllocations(
      projectId,
      Allocations.none(),
      Demands.none(),
      TimeSlot.empty(),
    );

  public static withDemands = (
    projectId: ProjectAllocationsId,
    demands: Demands,
  ) => new ProjectAllocations(projectId, Allocations.none(), demands);

  allocate = (
    _resourceId: ResourceId,
    _capability: Capability,
    requestedSlot: TimeSlot,
    _when: UTCDate,
  ): CapabilitiesAllocated | null => {
    if (this.nothingAllocated() || !this.withinProjectTimeSlot(requestedSlot)) {
      return null;
    }
    return new CapabilitiesAllocated(
      undefined!,
      undefined!,
      undefined!,
      undefined!,
      undefined,
    );
  };

  private nothingAllocated = (): boolean => false;

  private withinProjectTimeSlot = (_requestedSlot: TimeSlot) => false;

  public release = (
    _allocatedCapabilityId: UUID,
    _timeSlot: TimeSlot,
    _when: UTCDate,
  ): CapabilityReleased | null => {
    if (this.nothingReleased()) {
      return null;
    }
    return new CapabilityReleased(undefined!, undefined!, undefined!);
  };

  private nothingReleased = (): boolean => false;

  missingDemands = (): Demands =>
    this.#demands.missingDemands(this.allocations);

  public get allocations(): Allocations {
    return this.#allocations;
  }

  hasTimeSlot = () => !this.#timeSlot.equals(TimeSlot.empty());
}
