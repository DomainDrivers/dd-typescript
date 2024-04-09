import {
  AllocationConfiguration,
  type CapabilityFinder,
  type NotSatisfiedDemands,
  type PotentialTransfersService,
} from '#allocation';
import { AvailabilityConfiguration } from '#availability';
import type { NeededResourcesChosen } from '#planning';
import {
  PlanningConfiguration,
  type CapabilitiesDemanded,
  type CriticalStagePlanned,
} from '#planning';
import { ResourceConfiguration } from '#resource';
import { SimulationConfiguration } from '#simulation';
import { getDB, injectDatabase } from '#storage';
import { Clock, UtilsConfiguration } from '#utils';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  VerifyCriticalResourceAvailableDuringPlanning,
  VerifyEnoughDemandsDuringPlanning,
  VerifyNeededResourcesAvailableInTimeSlot,
  type RiskPeriodicCheckSagaEvent,
} from '.';
import { RiskPeriodicCheckSagaDispatcher } from './riskPeriodicCheckSagaDispatcher';
import {
  DrizzleRiskPeriodicCheckSagaRepository,
  type RiskPeriodicCheckSagaRepository,
} from './riskPeriodicCheckSagaRepository';
import { RiskPushNotification } from './riskPushNotification';
import * as schema from './schema';

type Dependencies = {
  utilsConfiguration?: UtilsConfiguration;
  availabilityConfiguration?: AvailabilityConfiguration;
  planningConfiguration?: PlanningConfiguration;
  simmulationConfiguration?: SimulationConfiguration;
  resourceConfiguration?: ResourceConfiguration;
  allocationConfiguration?: AllocationConfiguration;
  riskPushNotification?: RiskPushNotification;
};

export class RiskConfiguration {
  #riskPushNotification: RiskPushNotification | undefined;
  #utilsConfiguration: UtilsConfiguration;
  #availabilityConfiguration: AvailabilityConfiguration;
  #planningConfiguration: PlanningConfiguration;
  #simmulationConfiguration: SimulationConfiguration;
  #allocationConfiguration: AllocationConfiguration;
  #resourceConfiguration: ResourceConfiguration;

  constructor(
    public readonly connectionString: string,
    dependencies: Dependencies,
  ) {
    const {
      utilsConfiguration,
      availabilityConfiguration,
      planningConfiguration,
      simmulationConfiguration,
      resourceConfiguration,
      allocationConfiguration,
      riskPushNotification,
    } = dependencies;

    this.#utilsConfiguration = utilsConfiguration ?? new UtilsConfiguration();
    this.#availabilityConfiguration =
      availabilityConfiguration ??
      new AvailabilityConfiguration(connectionString, utilsConfiguration);
    this.#planningConfiguration =
      planningConfiguration ??
      new PlanningConfiguration(
        connectionString,
        utilsConfiguration,
        availabilityConfiguration,
      );
    this.#simmulationConfiguration =
      simmulationConfiguration ?? new SimulationConfiguration();
    this.#resourceConfiguration =
      resourceConfiguration ??
      new ResourceConfiguration(connectionString, this.#utilsConfiguration);
    this.#allocationConfiguration =
      allocationConfiguration ??
      new AllocationConfiguration(
        connectionString,
        utilsConfiguration,
        availabilityConfiguration,
      );
    this.#riskPushNotification = riskPushNotification;
    this.subscribeToEvents();
  }

  private subscribeToEvents = () => {
    this.#utilsConfiguration.eventBus.subscribe<
      RiskPeriodicCheckSagaEvent | NotSatisfiedDemands
    >(
      [
        'EarningsRecalculated',
        'ProjectAllocationScheduled',
        'ResourceTakenOver',
        'NotSatisfiedDemands',
      ],
      (event) => this.riskSagaDispatcher().handle(event),
    );

    this.#utilsConfiguration.eventBus.subscribe<CriticalStagePlanned>(
      ['CriticalStagePlanned'],
      (event) =>
        this.verifyCriticalResourceAvailableDuringPlanning().handle(event),
    );
    this.#utilsConfiguration.eventBus.subscribe<CapabilitiesDemanded>(
      ['CapabilitiesDemanded'],
      (event) => this.verifyEnoughDemandsDuringPlanning().handle(event),
    );
    this.#utilsConfiguration.eventBus.subscribe<NeededResourcesChosen>(
      ['NeededResourcesChosen'],
      (event) => this.verifyNeededResourcesAvailableInTimeSlot().handle(event),
    );
  };

  public riskSagaDispatcher = (
    riskPushNotification?: RiskPushNotification,
    stateRepository?: RiskPeriodicCheckSagaRepository,
    potentialTransfersService?: PotentialTransfersService,
    capabilityFinder?: CapabilityFinder,
    clock?: Clock,
    getDatabase?: () => NodePgDatabase<typeof schema>,
  ): RiskPeriodicCheckSagaDispatcher => {
    const getDB = getDatabase ?? (() => this.db());

    return injectDatabase(
      new RiskPeriodicCheckSagaDispatcher(
        stateRepository ?? this.riskPeriodicCheckSagaRepository(),
        potentialTransfersService ??
          this.#allocationConfiguration.potentialTransfersService(),
        capabilityFinder ?? this.#allocationConfiguration.capabilityFinder(),
        riskPushNotification ?? this.riskPushNotification(),
        clock ?? this.#utilsConfiguration.clock,
      ),
      getDB(),
      this.#utilsConfiguration.eventBus.commit,
    );
  };

  public verifyCriticalResourceAvailableDuringPlanning = () =>
    injectDatabase(
      new VerifyCriticalResourceAvailableDuringPlanning(
        this.#availabilityConfiguration.availabilityFacade(),
        this.riskPushNotification(),
      ),
      this.db(),
      this.#utilsConfiguration.eventBus.commit,
    );

  public verifyEnoughDemandsDuringPlanning = () =>
    injectDatabase(
      new VerifyEnoughDemandsDuringPlanning(
        this.#planningConfiguration.planningFacade(),
        this.#simmulationConfiguration.simulationFacade(),
        this.#resourceConfiguration.resourceFacade(),
        this.riskPushNotification(),
      ),
      this.db(),
      this.#utilsConfiguration.eventBus.commit,
    );

  public verifyNeededResourcesAvailableInTimeSlot = () =>
    injectDatabase(
      new VerifyNeededResourcesAvailableInTimeSlot(
        this.#availabilityConfiguration.availabilityFacade(),
        this.riskPushNotification(),
      ),
      this.db(),
      this.#utilsConfiguration.eventBus.commit,
    );

  public riskPushNotification = () =>
    this.#riskPushNotification ?? new RiskPushNotification();

  public riskPeriodicCheckSagaRepository = () =>
    new DrizzleRiskPeriodicCheckSagaRepository();

  public db = (cs?: string): NodePgDatabase<typeof schema> =>
    getDB(cs ?? this.connectionString, { schema });
}
