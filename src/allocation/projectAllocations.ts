import { Capability, TimeSlot } from '#shared';
import { UUID, deepEquals, event } from '#utils';
import type { UTCDate } from '@date-fns/utc';
import {
  AllocatableCapabilityId,
  AllocatedCapability,
  Allocations,
  Demands,
  ProjectAllocationsId,
  type ProjectAllocationScheduled,
} from '.';
import { type CapabilitiesAllocated } from './capabilitiesAllocated';
import { type CapabilityReleased } from './capabilitiesReleased';
import { type ProjectAllocationsDemandsScheduled } from './projectAllocationDemandsScheduled';

export class ProjectAllocations {
  private _projectId: ProjectAllocationsId;
  private _allocations: Allocations;
  private _demands: Demands;
  private _timeSlot: TimeSlot;

  constructor(
    projectId: ProjectAllocationsId,
    allocations: Allocations,
    scheduledDemands: Demands,
    timeSlot: TimeSlot = TimeSlot.empty(),
  ) {
    this._projectId = projectId;
    this._allocations = allocations;
    this._demands = scheduledDemands;
    this._timeSlot = timeSlot;
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
    capability: Capability,
    requestedSlot: TimeSlot,
    when: UTCDate,
  ): CapabilitiesAllocated | null => {
    const allocatedCapability = new AllocatedCapability(
      allocatableCapabilityId,
      capability,
      requestedSlot,
    );
    const newAllocations = this._allocations.add(allocatedCapability);

    if (
      this.nothingAllocated(newAllocations) ||
      !this.withinProjectTimeSlot(requestedSlot)
    ) {
      return null;
    }
    this._allocations = newAllocations;

    return {
      type: 'CapabilitiesAllocated',
      data: {
        allocatedCapabilityId: allocatedCapability.allocatedCapabilityId,
        projectId: this._projectId,
        missingDemands: this.missingDemands(),
        occurredAt: when,
        eventId: UUID.randomUUID(),
      },
    };
  };

  private nothingAllocated = (newAllocations: Allocations): boolean =>
    deepEquals(this._allocations, newAllocations);

  private withinProjectTimeSlot = (requestedSlot: TimeSlot) =>
    !this.hasTimeSlot() || requestedSlot.within(this._timeSlot);

  public release = (
    allocatedCapabilityId: AllocatableCapabilityId,
    timeSlot: TimeSlot,
    when: UTCDate,
  ): CapabilityReleased | null => {
    const newAllocations = this._allocations.remove(
      allocatedCapabilityId,
      timeSlot,
    );
    if (deepEquals(newAllocations, this._allocations)) {
      return null;
    }
    this._allocations = newAllocations;
    return {
      type: 'CapabilityReleased',
      data: {
        projectId: this._projectId,
        missingDemands: this.missingDemands(),
        occurredAt: when,
        eventId: UUID.randomUUID(),
      },
    };
  };

  missingDemands = (): Demands =>
    this._demands.missingDemands(this._allocations);

  hasTimeSlot = () => !this._timeSlot.equals(TimeSlot.empty());

  public defineSlot = (
    timeSlot: TimeSlot,
    when: UTCDate,
  ): ProjectAllocationScheduled | null => {
    this._timeSlot = timeSlot;

    return {
      type: 'ProjectAllocationScheduled',
      data: {
        fromTo: timeSlot,
        projectId: this._projectId,
        occurredAt: when,
        eventId: UUID.randomUUID(),
      },
    };
  };

  public addDemands = (
    newDemands: Demands,
    when: UTCDate,
  ): ProjectAllocationsDemandsScheduled | null => {
    this._demands = this._demands.withNew(newDemands);
    return event<ProjectAllocationsDemandsScheduled>(
      'ProjectAllocationsDemandsScheduled',
      {
        projectId: this._projectId,
        missingDemands: this.missingDemands(),
        occurredAt: when,
      },
    );
  };

  public get id(): ProjectAllocationsId {
    return this._projectId;
  }

  public get demands(): Demands {
    return this._demands;
  }

  public get allocations(): Allocations {
    return this._allocations;
  }

  public get timeSlot(): TimeSlot {
    return this._timeSlot;
  }
}
