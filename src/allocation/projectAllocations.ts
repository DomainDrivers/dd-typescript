import { TimeSlot } from '#shared';
import { UUID, deepEquals, event } from '#utils';
import type { UTCDate } from '@date-fns/utc';
import {
  AllocatableCapabilityId,
  AllocatedCapability,
  Allocations,
  CapabilitySelector,
  Demands,
  ProjectAllocationsId,
  type ProjectAllocationScheduled,
} from '.';
import { type CapabilitiesAllocated } from './capabilitiesAllocated';
import { type CapabilityReleased } from './capabilitiesReleased';
import { type ProjectAllocationsDemandsScheduled } from './projectAllocationDemandsScheduled';

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
    allocatableCapabilityId: AllocatableCapabilityId,
    capability: CapabilitySelector,
    requestedSlot: TimeSlot,
    when: UTCDate,
  ): CapabilitiesAllocated | null => {
    const allocatedCapability = new AllocatedCapability(
      allocatableCapabilityId,
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

    return {
      type: 'CapabilitiesAllocated',
      data: {
        allocatedCapabilityId: allocatedCapability.allocatedCapabilityId,
        projectId: this.#projectId,
        missingDemands: this.missingDemands(),
        occurredAt: when,
        eventId: UUID.randomUUID(),
      },
    };
  };

  private nothingAllocated = (newAllocations: Allocations): boolean =>
    deepEquals(this.#allocations, newAllocations);

  private withinProjectTimeSlot = (requestedSlot: TimeSlot) =>
    !this.hasTimeSlot() || requestedSlot.within(this.#timeSlot);

  public release = (
    allocatedCapabilityId: AllocatableCapabilityId,
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
    return {
      type: 'CapabilityReleased',
      data: {
        projectId: this.#projectId,
        missingDemands: this.missingDemands(),
        occurredAt: when,
        eventId: UUID.randomUUID(),
      },
    };
  };

  missingDemands = (): Demands =>
    this.#demands.missingDemands(this.#allocations);

  hasTimeSlot = () => !this.#timeSlot.equals(TimeSlot.empty());

  public defineSlot = (
    timeSlot: TimeSlot,
    when: UTCDate,
  ): ProjectAllocationScheduled | null => {
    this.#timeSlot = timeSlot;

    return {
      type: 'ProjectAllocationScheduled',
      data: {
        fromTo: timeSlot,
        projectId: this.#projectId,
        occurredAt: when,
        eventId: UUID.randomUUID(),
      },
    };
  };

  public addDemands = (
    newDemands: Demands,
    when: UTCDate,
  ): ProjectAllocationsDemandsScheduled | null => {
    this.#demands = this.#demands.withNew(newDemands);
    return event<ProjectAllocationsDemandsScheduled>(
      'ProjectAllocationsDemandsScheduled',
      {
        projectId: this.#projectId,
        missingDemands: this.missingDemands(),
        occurredAt: when,
      },
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
