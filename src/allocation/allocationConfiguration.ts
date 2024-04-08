import { AvailabilityConfiguration } from '#availability';
import { SimulationConfiguration } from '#simulation';
import { getDB, injectDatabase } from '#storage';
import {
  Clock,
  UtilsConfiguration,
  getInMemoryEventsBus,
  type EventsPublisher,
} from '#utils';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  AllocationFacade,
  CapabilityFinder,
  CapabilityPlanningConfiguration,
  CashflowConfiguration,
  PotentialTransfersService,
} from '.';
import {
  DrizzleProjectAllocationsRepository,
  type ProjectAllocationsRepository,
} from './projectAllocationsRepository';
import * as schema from './schema';

export class AllocationConfiguration {
  constructor(
    public readonly connectionString: string,
    public readonly utilsConfiguration: UtilsConfiguration = new UtilsConfiguration(),
    public readonly availabilityConfiguration: AvailabilityConfiguration = new AvailabilityConfiguration(
      connectionString,
      utilsConfiguration,
    ),
    public readonly capabilityPlanningConfiguration: CapabilityPlanningConfiguration = new CapabilityPlanningConfiguration(
      connectionString,
    ),
    public readonly cashflowConfiguration: CashflowConfiguration = new CashflowConfiguration(
      connectionString,
      utilsConfiguration,
    ),
    public readonly simulationConfiguration: SimulationConfiguration = new SimulationConfiguration(),
  ) {}

  public allocationFacade = (
    clock: Clock = Clock,
    eventPublisher?: EventsPublisher,
    projectAllocationsRepository?: ProjectAllocationsRepository,
    getDatabase?: () => NodePgDatabase<typeof schema>,
  ) => {
    const repository =
      projectAllocationsRepository ?? this.projectAllocationsRepository();
    const getDB = getDatabase ?? (() => this.db());

    return injectDatabase(
      new AllocationFacade(
        repository,
        this.availabilityConfiguration.availabilityFacade(),
        this.capabilityPlanningConfiguration.capabilityFinder(),
        eventPublisher ?? this.eventPublisher(),
        clock,
      ),
      getDB(),
    );
  };

  public potentialTransfersService = (
    projectAllocationsRepository?: ProjectAllocationsRepository,
  ) =>
    injectDatabase(
      new PotentialTransfersService(
        this.simulationConfiguration.simulationFacade(),
        this.cashflowConfiguration.cashflowFacade(),
        projectAllocationsRepository ?? this.projectAllocationsRepository(),
      ),
      this.db(),
    );

  public capabilityFinder = (): CapabilityFinder =>
    injectDatabase(
      new CapabilityFinder(
        this.availabilityConfiguration.availabilityFacade(),
        this.capabilityPlanningConfiguration.allocatableResourceRepository(),
      ),
      this.db(),
    );

  public projectAllocationsRepository = (): ProjectAllocationsRepository =>
    new DrizzleProjectAllocationsRepository();

  public db = (cs?: string): NodePgDatabase<typeof schema> =>
    getDB(cs ?? this.connectionString, { schema });

  public eventPublisher = (): EventsPublisher => getInMemoryEventsBus();
}
