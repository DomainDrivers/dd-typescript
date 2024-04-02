import type { TimeSlot } from '#shared';
import {
  ProjectId,
  SimulatedProject,
  Demand as SimulationDemand,
  Demands as SimulationDemands,
} from '#simulation';
import type { ObjectMap, UUID } from '#utils';
import { AllocatedCapability } from './allocatedCapability';
import { Demands } from './demands';
import { Project } from './project';

export class Projects {
  constructor(public readonly projects: ObjectMap<UUID, Project>) {}

  public transfer = (
    projectFrom: UUID,
    projectTo: UUID,
    capability: AllocatedCapability,
    forSlot: TimeSlot,
  ): Projects => {
    const from = this.projects.get(projectFrom) ?? null;
    const to = this.projects.get(projectTo) ?? null;
    if (from === null || to === null) {
      return this;
    }
    const removed = from.remove(capability, forSlot);
    if (removed === null) {
      return this;
    }
    to.add(
      new AllocatedCapability(removed.resourceId, removed.capability, forSlot),
    );
    return new Projects(this.projects);
  };

  public toSimulatedProjects = (): SimulatedProject[] =>
    this.projects.map(
      (entry) =>
        new SimulatedProject(
          ProjectId.from(entry.key),
          () => entry.value.earnings,
          this.getMissingDemands(entry.value),
        ),
    );

  getMissingDemands = (project: Project): SimulationDemands => {
    const allDemands: Demands = project.missingDemands();
    return new SimulationDemands(
      allDemands.all.map(
        (demand) => new SimulationDemand(demand.capability, demand.slot),
      ),
    );
  };
}
