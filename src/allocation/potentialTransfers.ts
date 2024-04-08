import {
  ProjectId,
  Demand as SimulatedDemand,
  Demands as SimulatedDemands,
  SimulatedProject,
} from '#simulation';
import {
  AllocatableCapabilityId,
  AllocatableCapabilitySummary,
  AllocatedCapability,
  ProjectAllocationsId,
  ProjectsAllocationsSummary,
} from '.';
import type { TimeSlot } from '../shared';
import { deepEquals, type ObjectMap } from '../utils';
import type { Earnings } from './cashflow/earnings';

export class PotentialTransfers {
  constructor(
    public readonly summary: ProjectsAllocationsSummary,
    public readonly earnings: ObjectMap<ProjectAllocationsId, Earnings>,
  ) {}

  transfer = (
    projectFrom: ProjectAllocationsId,
    projectTo: ProjectAllocationsId,
    allocatedCapability: AllocatedCapability,
    forSlot: TimeSlot,
  ): PotentialTransfers => {
    const from = this.summary.projectAllocations.get(projectFrom);
    const to = this.summary.projectAllocations.get(projectTo);
    if (from == null || to == null) {
      return this;
    }
    const newAllocationsProjectFrom = from.remove(
      allocatedCapability.allocatedCapabilityId,
      forSlot,
    );
    if (deepEquals(newAllocationsProjectFrom, from)) {
      return this;
    }
    this.summary.projectAllocations.set(projectFrom, newAllocationsProjectFrom);
    const newAllocationsProjectTo = to.add(
      new AllocatedCapability(
        allocatedCapability.allocatedCapabilityId,
        allocatedCapability.capability,
        forSlot,
      ),
    );
    this.summary.projectAllocations.set(projectTo, newAllocationsProjectTo);
    return new PotentialTransfers(this.summary, this.earnings);
  };

  toSimulatedProjects = (): SimulatedProject[] =>
    this.summary.projectAllocations.map(
      ({ key: project }) =>
        new SimulatedProject(
          ProjectId.from(project),
          () => this.earnings.get(project)!,
          this.getMissingDemands(project),
        ),
    );

  getMissingDemands = (
    projectAllocationsId: ProjectAllocationsId,
  ): SimulatedDemands => {
    const allDemands = this.summary.demands
      .get(projectAllocationsId)!
      .missingDemands(
        this.summary.projectAllocations.get(projectAllocationsId)!,
      );
    return new SimulatedDemands(
      allDemands.all.map(
        (demand) => new SimulatedDemand(demand.capability, demand.slot),
      ),
    );
  };

  public transferWithSummary = (
    projectTo: ProjectAllocationsId,
    capabilityToTransfer: AllocatableCapabilitySummary,
    forSlot: TimeSlot,
  ): PotentialTransfers => {
    const projectToMoveFrom = this.findProjectToMoveFrom(
      capabilityToTransfer.id,
      forSlot,
    );
    if (projectToMoveFrom != null) {
      return this.transfer(
        projectToMoveFrom,
        projectTo,
        new AllocatedCapability(
          capabilityToTransfer.id,
          capabilityToTransfer.capabilities,
          capabilityToTransfer.timeSlot,
        ),
        forSlot,
      );
    }
    return this;
  };

  private findProjectToMoveFrom = (
    cap: AllocatableCapabilityId,
    _inSlot: TimeSlot,
  ): ProjectAllocationsId => {
    return (
      this.summary.projectAllocations.filter(
        ({ value }) => value.find(cap) !== null,
      )[0]?.key ?? null
    );
  };
}
