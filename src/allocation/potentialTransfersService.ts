import { CashFlowFacade, ProjectsAllocationsSummary } from '#allocation';
import type { TimeSlot } from '#shared';
import { SimulatedCapabilities, SimulationFacade } from '#simulation';
import type BigNumber from 'bignumber.js';
import type {
  AllocatableCapabilitySummary,
  ProjectAllocationsRepository,
} from '.';
import { dbconnection } from '../storage';
import type { AllocatedCapability } from './allocatedCapability';
import { PotentialTransfers } from './potentialTransfers';
import type { ProjectAllocationsId } from './projectAllocationsId';

export class PotentialTransfersService {
  constructor(
    private readonly simulationFacade: SimulationFacade,
    private readonly cashFlowFacade: CashFlowFacade,
    private readonly projectAllocationsRepository: ProjectAllocationsRepository,
  ) {}

  @dbconnection
  public async profitAfterMovingCapabilities(
    projectId: ProjectAllocationsId,
    capabilityToMove: AllocatableCapabilitySummary,
    timeSlot: TimeSlot,
  ): Promise<BigNumber> {
    //cached?
    const potentialTransfers = new PotentialTransfers(
      ProjectsAllocationsSummary.of(
        await this.projectAllocationsRepository.findAll(),
      ),
      await this.cashFlowFacade.findAllEarnings(),
    );
    return this.checkPotentialTransferWithSummary(
      potentialTransfers,
      projectId,
      capabilityToMove,
      timeSlot,
    );
  }

  private checkPotentialTransferWithSummary(
    transfers: PotentialTransfers,
    projectTo: ProjectAllocationsId,
    capabilityToMove: AllocatableCapabilitySummary,
    forSlot: TimeSlot,
  ): BigNumber {
    const resultBefore = this.simulationFacade.whatIsTheOptimalSetup(
      transfers.toSimulatedProjects(),
      SimulatedCapabilities.none(),
    );
    transfers = transfers.transferWithSummary(
      projectTo,
      capabilityToMove,
      forSlot,
    );
    const resultAfter = this.simulationFacade.whatIsTheOptimalSetup(
      transfers.toSimulatedProjects(),
      SimulatedCapabilities.none(),
    );
    return resultAfter.profit.minus(resultBefore.profit);
  }

  public checkPotentialTransfer = (
    projects: PotentialTransfers,
    projectFrom: ProjectAllocationsId,
    projectTo: ProjectAllocationsId,
    capability: AllocatedCapability,
    forSlot: TimeSlot,
  ): BigNumber => {
    //Project rather fetched from db.
    const resultBefore = this.simulationFacade.whatIsTheOptimalSetup(
      projects.toSimulatedProjects(),
      SimulatedCapabilities.none(),
    );
    projects = projects.transfer(projectFrom, projectTo, capability, forSlot);
    const resultAfter = this.simulationFacade.whatIsTheOptimalSetup(
      projects.toSimulatedProjects(),
      SimulatedCapabilities.none(),
    );
    return resultAfter.profit.minus(resultBefore.profit);
  };
}
