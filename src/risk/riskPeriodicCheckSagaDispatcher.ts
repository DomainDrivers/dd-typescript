import {
  AllocatableCapabilitiesSummary,
  CapabilityFinder,
  Demand,
  Demands,
  PotentialTransfersService,
  ProjectAllocationsId,
  type CapabilitiesAllocated,
  type CapabilityReleased,
  type EarningsRecalculated,
  type ProjectAllocationScheduled,
  type ProjectAllocationsDemandsScheduled,
} from '#allocation';
import type { ResourceTakenOver } from '#availability';
import { dbconnection } from '#storage';
import { Clock, ObjectMap } from '#utils';
import {
  RiskPeriodicCheckSaga,
  RiskPushNotification,
  type RiskPeriodicCheckSagaEvent,
  type RiskPeriodicCheckSagaStep,
} from '.';
import type { RiskPeriodicCheckSagaRepository } from './riskPeriodicCheckSagaRepository';

export class RiskPeriodicCheckSagaDispatcher {
  constructor(
    private readonly riskSagaRepository: RiskPeriodicCheckSagaRepository,
    private readonly potentialTransfersService: PotentialTransfersService,
    private readonly capabilityFinder: CapabilityFinder,
    private readonly riskPushNotification: RiskPushNotification,
    private readonly clock: Clock,
  ) {}

  @dbconnection
  //remember about transactions spanning saga and potential external system
  public handle(event: RiskPeriodicCheckSagaEvent): Promise<void> {
    switch (event.type) {
      case 'ProjectAllocationsDemandsScheduled':
        return this.handleProjectAllocationsDemandsScheduled(event);
      case 'EarningsRecalculated':
        return this.handleEarningsRecalculated(event);
      case 'ProjectAllocationScheduled':
        return this.handleProjectAllocationScheduled(event);
      case 'CapabilitiesAllocated':
        return this.handleCapabilitiesAllocated(event);
      case 'CapabilityReleased':
        return this.handleCapabilityReleased(event);
      case 'ResourceTakenOver':
        return this.handleResourceTakenOver(event);
    }
  }

  //remember about transactions spanning saga and potential external system
  @dbconnection
  public async handleProjectAllocationsDemandsScheduled(
    event: ProjectAllocationsDemandsScheduled,
  ): Promise<void> {
    let found = await this.riskSagaRepository.findByProjectId(
      event.data.projectId,
    );
    if (found == null) {
      found = new RiskPeriodicCheckSaga(
        event.data.projectId,
        event.data.missingDemands,
      );
    }
    const nextStep = found.handle(event);
    await this.riskSagaRepository.save(found);
    return this.perform(nextStep, found);
  }

  //remember about transactions spanning saga and potential external system
  public async handleEarningsRecalculated(
    event: EarningsRecalculated,
  ): Promise<void> {
    let found = await this.riskSagaRepository.findByProjectId(
      event.data.projectId,
    );
    if (found == null) {
      found = new RiskPeriodicCheckSaga(
        event.data.projectId,
        event.data.earnings,
      );
    }
    const nextStep = found.handle(event);
    await this.riskSagaRepository.save(found);
    return this.perform(nextStep, found);
  }

  //remember about transactions spanning saga and potential external system
  public async handleProjectAllocationScheduled(
    event: ProjectAllocationScheduled,
  ): Promise<void> {
    const found = await this.riskSagaRepository.findByProjectId(
      event.data.projectId,
    );
    if (found === null)
      throw Error(
        `RiskPeriodicCheckSaga for projectId: '${event.data.projectId}' was not found!`,
      );
    const nextStep = found.handle(event);
    await this.riskSagaRepository.save(found);
    return this.perform(nextStep, found);
  }

  //remember about transactions spanning saga and potential external system
  public async handleCapabilitiesAllocated(
    event: CapabilitiesAllocated,
  ): Promise<void> {
    const saga = await this.riskSagaRepository.findByProjectId(
      event.data.projectId,
    );
    if (saga === null)
      throw Error(
        `RiskPeriodicCheckSaga for projectId: '${event.data.projectId}' was not found!`,
      );
    const nextStep = saga.handle(event);
    await this.riskSagaRepository.save(saga);
    return this.perform(nextStep, saga);
  }

  //remember about transactions spanning saga and potential external system
  public async handleCapabilityReleased(
    event: CapabilityReleased,
  ): Promise<void> {
    const saga = await this.riskSagaRepository.findByProjectId(
      event.data.projectId,
    );
    if (saga === null)
      throw Error(
        `RiskPeriodicCheckSaga for projectId: '${event.data.projectId}' was not found!`,
      );
    const nextStep = saga.handle(event);
    await this.riskSagaRepository.save(saga);
    return this.perform(nextStep, saga);
  }

  //remember about transactions spanning saga and potential external system
  public async handleResourceTakenOver(
    event: ResourceTakenOver,
  ): Promise<void> {
    const interested = event.data.previousOwners.map((owner) =>
      ProjectAllocationsId.from(owner.owner),
    );

    const sagas = await this.riskSagaRepository.findByProjectIdIn(interested);
    //transaction per one saga
    for (const saga of sagas) {
      await this.handleSingleResourceTakenOver(saga, event);
    }
  }

  private async handleSingleResourceTakenOver(
    saga: RiskPeriodicCheckSaga,
    event: ResourceTakenOver,
  ): Promise<void> {
    const nextStep = saga.handle(event);
    await this.riskSagaRepository.save(saga);
    return this.perform(nextStep, saga);
  }

  // @Scheduled(cron = "@weekly")
  public async handleWeeklyCheck(): Promise<void> {
    const sagas = await this.riskSagaRepository.findAll();
    for (const saga of sagas) {
      const nextStep = saga.handleWeeklyCheck(this.clock.now());
      await this.riskSagaRepository.save(saga);
      await this.perform(nextStep, saga);
    }
  }

  private perform = (
    nextStep: RiskPeriodicCheckSagaStep,
    saga: RiskPeriodicCheckSaga,
  ): Promise<void> => {
    switch (nextStep) {
      case 'NOTIFY_ABOUT_DEMANDS_SATISFIED':
        return this.riskPushNotification.notifyDemandsSatisfied(saga.projectId);
      case 'FIND_AVAILABLE':
        return this.handleFindAvailableFor(saga);
      case 'DO_NOTHING':
        return Promise.resolve();
      case 'SUGGEST_REPLACEMENT':
        return this.handleSimulateRelocation(saga);
      case 'NOTIFY_ABOUT_POSSIBLE_RISK':
        return this.riskPushNotification.notifyAboutPossibleRisk(
          saga.projectId,
        );
    }
  };

  private handleFindAvailableFor = async (
    saga: RiskPeriodicCheckSaga,
  ): Promise<void> => {
    const replacements = await this.findAvailableReplacementsFor(
      saga.missingDemands!,
    );
    if (replacements.flatMap(({ value: ac }) => ac.all).length > 0) {
      await this.riskPushNotification.notifyAboutAvailability(
        saga.projectId,
        replacements,
      );
    }
  };

  private handleSimulateRelocation = async (
    saga: RiskPeriodicCheckSaga,
  ): Promise<void> => {
    const possibleReplacements = await this.findPossibleReplacements(
      saga.missingDemands!,
    );
    for (const replacement of possibleReplacements.flatMap(
      ({ value }) => value.all,
    )) {
      const profitAfterMovingCapabilities =
        await this.potentialTransfersService.profitAfterMovingCapabilities(
          saga.projectId,
          replacement,
          replacement.timeSlot,
        );
      if (profitAfterMovingCapabilities.isPositive()) {
        await this.riskPushNotification.notifyProfitableRelocationFound(
          saga.projectId,
          replacement.id,
        );
      }
    }
  };

  private findAvailableReplacementsFor = async (
    demands: Demands,
  ): Promise<ObjectMap<Demand, AllocatableCapabilitiesSummary>> => {
    const availableReplacements = ObjectMap.empty<
      Demand,
      AllocatableCapabilitiesSummary
    >();
    for (const demand of demands.all) {
      availableReplacements.push({
        key: demand,
        value: await this.capabilityFinder.findAvailableCapabilities(
          demand.capability,
          demand.slot,
        ),
      });
    }
    return availableReplacements;
  };

  private findPossibleReplacements = async (
    demands: Demands,
  ): Promise<ObjectMap<Demand, AllocatableCapabilitiesSummary>> => {
    const possibleReplacements = ObjectMap.empty<
      Demand,
      AllocatableCapabilitiesSummary
    >();
    for (const demand of demands.all) {
      possibleReplacements.push({
        key: demand,
        value: await this.capabilityFinder.findCapabilities(
          demand.capability,
          demand.slot,
        ),
      });
    }

    return possibleReplacements;
  };
}
