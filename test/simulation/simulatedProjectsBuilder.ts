import BigNumber from 'bignumber.js';
import {
  Demand,
  Demands,
  SimulatedProject,
  type ProjectId,
} from '../../src/simulation';

export class SimulatedProjectsBuilder {
  private currentId?: ProjectId;
  private readonly simulatedProjects: ProjectId[] = [];
  private readonly simulatedDemands = new Map<ProjectId, Demands>();
  private readonly values = new Map<ProjectId, () => BigNumber>();

  public withProject = (id: ProjectId) => {
    this.currentId = id;
    this.simulatedProjects.push(id);
    return this;
  };

  public thatRequires = (...demands: Demand[]) => {
    this.simulatedDemands.set(this.currentId!, Demands.of(...demands));
    return this;
  };

  public thatCanEarn = (earnings: BigNumber) => {
    this.values.set(this.currentId!, () => earnings);
    return this;
  };

  public thatCanGenerateReputationLoss = (factor: number) => {
    this.values.set(this.currentId!, () => new BigNumber(factor));
    return this;
  };

  public build = (): SimulatedProject[] => {
    return this.simulatedProjects.map(
      (id) =>
        new SimulatedProject(
          id,
          this.values.get(id)!,
          this.simulatedDemands.get(id)!,
        ),
    );
  };
}
