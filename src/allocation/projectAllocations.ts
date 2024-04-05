import { Capability, TimeSlot } from '#shared';
import { UUID, deepEquals } from '#utils';
import type { UTCDate } from '@date-fns/utc';
import {
  AllocatedCapability,
  Allocations,
  Demands,
  ProjectAllocationScheduled,
  ProjectAllocationsId,
  ResourceId,
} from '.';
import { CapabilitiesAllocated } from './capabilitiesAllocated';
import { CapabilityReleased } from './capabilitiesReleased';
import { ProjectAllocationsDemandsScheduled } from './projectAllocationDemandsScheduled';

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
    resourceId: ResourceId,
    capability: Capability,
    requestedSlot: TimeSlot,
    when: UTCDate,
  ): CapabilitiesAllocated | null => {
    const allocatedCapability = new AllocatedCapability(
      resourceId,
      capability,
      requestedSlot,
    );
    const newAllocations = this.#allocations.add(allocatedCapability);

    if (
      this.nothingAllocated(newAllocations) ||
      !this.withinProjectTimeSlot(requestedSlot)
    ) {
      return null;
    }
    this.#allocations = newAllocations;

    return new CapabilitiesAllocated(
      allocatedCapability.allocatedCapabilityID,
      this.#projectId,
      this.missingDemands(),
      when,
    );
  };

  private nothingAllocated = (newAllocations: Allocations): boolean =>
    deepEquals(this.#allocations, newAllocations);

  private withinProjectTimeSlot = (requestedSlot: TimeSlot) =>
    !this.hasTimeSlot() || requestedSlot.within(this.#timeSlot);

  public release = (
    allocatedCapabilityId: UUID,
    timeSlot: TimeSlot,
    when: UTCDate,
  ): CapabilityReleased | null => {
    const newAllocations = this.#allocations.remove(
      allocatedCapabilityId,
      timeSlot,
    );
    if (deepEquals(newAllocations, this.#allocations)) {
      return null;
    }
    this.#allocations = newAllocations;
    return new CapabilityReleased(this.#projectId, this.missingDemands(), when);
  };

  missingDemands = (): Demands =>
    this.#demands.missingDemands(this.#allocations);

  hasTimeSlot = () => !this.#timeSlot.equals(TimeSlot.empty());

  public defineSlot = (
    timeSlot: TimeSlot,
    when: UTCDate,
  ): ProjectAllocationScheduled | null => {
    this.#timeSlot = timeSlot;
    return new ProjectAllocationScheduled(
      this.#projectId,
      this.#timeSlot,
      when,
    );
  };

  public addDemands = (
    newDemands: Demands,
    when: UTCDate,
  ): ProjectAllocationsDemandsScheduled | null => {
    this.#demands = this.#demands.withNew(newDemands);
    return new ProjectAllocationsDemandsScheduled(
      this.#projectId,
      this.missingDemands(),
      when,
    );
  };

  public get id(): ProjectAllocationsId {
    return this.#projectId;
  }

  public get demands(): Demands {
    return this.#demands;
  }

  public get allocations(): Allocations {
    return this.#allocations;
  }

  public get timeSlot(): TimeSlot {
    return this.#timeSlot;
  }
}
