import BigNumber from 'bignumber.js';
import type { RiskPushNotification } from '.';
import { CapabilitySelector } from '../allocation';
import {
  PlanningFacade,
  ProjectCard,
  type CapabilitiesDemanded,
} from '../planning';
import type { ResourceFacade } from '../resource';
import { Capability, TimeSlot } from '../shared';
import {
  AvailableResourceCapability,
  Demand,
  Demands,
  ProjectId,
  SimulatedCapabilities,
  SimulatedProject,
  SimulationFacade,
} from '../simulation';
import { dbconnection } from '../storage';
import { UUID } from '../utils';

const SAME_ARBITRARY_VALUE_FOR_EVERY_PROJECT = 100;

export class VerifyEnoughDemandsDuringPlanning {
  constructor(
    private readonly planningFacade: PlanningFacade,
    private readonly simulationFacade: SimulationFacade,
    private readonly resourceFacade: ResourceFacade,
    private readonly riskPushNotification: RiskPushNotification,
  ) {}

  @dbconnection
  public async handle({
    data: capabilitiesDemanded,
  }: CapabilitiesDemanded): Promise<void> {
    const projectSummaries = await this.planningFacade.loadAll();
    const allCapabilities = await this.resourceFacade.findAllCapabilities();
    if (
      this.notAbleToHandleAllProjectsGivenCapabilities(
        projectSummaries,
        allCapabilities,
      )
    ) {
      await this.riskPushNotification.notifyAboutPossibleRiskDuringPlanning(
        capabilitiesDemanded.projectId,
        capabilitiesDemanded.demands,
      );
    }
  }

  private notAbleToHandleAllProjectsGivenCapabilities(
    projectSummaries: ProjectCard[],
    allCapabilities: Capability[],
  ): boolean {
    const capabilities = allCapabilities.map(
      (cap) =>
        new AvailableResourceCapability(
          UUID.randomUUID(),
          CapabilitySelector.canJustPerform(cap),
          TimeSlot.empty(),
        ),
    );
    const simulatedProjects = projectSummaries.map((card) =>
      this.createSamePriceSimulatedProject(card),
    );
    const result = this.simulationFacade.whatIsTheOptimalSetup(
      simulatedProjects,
      new SimulatedCapabilities(capabilities),
    );
    return result.chosenItems.length != projectSummaries.length;
  }

  private createSamePriceSimulatedProject(card: ProjectCard): SimulatedProject {
    const simulatedDemands = card.demands.all.map(
      (demand) => new Demand(demand.capability, TimeSlot.empty()),
    );
    return new SimulatedProject(
      ProjectId.from(card.projectId),
      () => new BigNumber(SAME_ARBITRARY_VALUE_FOR_EVERY_PROJECT),
      new Demands(simulatedDemands),
    );
  }
}
