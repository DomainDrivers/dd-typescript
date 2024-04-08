import {
  AllocatableCapabilitiesSummary,
  AllocatableCapabilityId,
  AllocationConfiguration,
  AllocationFacade,
  CashFlowFacade,
  CashflowConfiguration,
  Cost,
  Demand,
  Demands,
  Earnings,
  Income,
  ProjectAllocationsId,
  type CapabilitiesAllocated,
  type EarningsRecalculated,
  type ProjectAllocationScheduled,
  type ProjectAllocationsDemandsScheduled,
} from '#allocation';
import { Owner, ResourceId, type ResourceTakenOver } from '#availability';
import { EmployeeConfiguration, EmployeeFacade, Seniority } from '#resource';
import {
  RiskConfiguration,
  RiskPushNotification,
  type RiskPeriodicCheckSagaDispatcher,
} from '#risk';
import * as schema from '#schema';
import { Capability, TimeSlot } from '#shared';
import { Clock, ObjectMap, ObjectSet, UUID, deepEquals, event } from '#utils';
import { UTCDate } from '@date-fns/utc';
import { addDays, subDays } from 'date-fns';
import { after, before, beforeEach, describe, it } from 'node:test';
import { ProjectId } from '../../src/simulation';
import { argMatches, argValue, assertEquals, verifyThat } from '../asserts';
import { TestConfiguration } from '../setup';

void describe('RiskPeriodicCheckSagaDispatcherE2E', () => {
  const testEnvironment = TestConfiguration();
  let employeeFacade: EmployeeFacade;
  let allocationFacade: AllocationFacade;
  let cashFlowFacade: CashFlowFacade;
  let riskSagaDispatcher: RiskPeriodicCheckSagaDispatcher;
  let riskPushNotification: RiskPushNotification;
  let clock: Clock;

  const ONE_DAY_LONG = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
  const PROJECT_DATES = new TimeSlot(new UTCDate(), addDays(new UTCDate(), 20));

  before(async () => {
    const connectionString = await testEnvironment.start({ schema });

    const allocationConfiguration = new AllocationConfiguration(
      connectionString,
      testEnvironment.utilsConfiguration,
    );
    allocationFacade = allocationConfiguration.allocationFacade();

    const employeeConfiguration = new EmployeeConfiguration(
      connectionString,
      testEnvironment.utilsConfiguration,
    );
    employeeFacade = employeeConfiguration.employeeFacade();

    cashFlowFacade = new CashflowConfiguration(
      connectionString,
      testEnvironment.utilsConfiguration,
    ).cashflowFacade();

    riskPushNotification = new RiskPushNotification();

    const riskConfiguration = new RiskConfiguration(connectionString, {
      utilsConfiguration: testEnvironment.utilsConfiguration,
      riskPushNotification,
    });
    riskSagaDispatcher = riskConfiguration.riskSagaDispatcher();
    clock = testEnvironment.utilsConfiguration.clock;
  });

  beforeEach(testEnvironment.clearTestData);

  after(async () => await testEnvironment.stop());

  void it('Informs about demand satisfied', async ({ mock }) => {
    const notifyDemandsSatisfied = mock.method(
      riskPushNotification,
      'notifyDemandsSatisfied',
    );
    //given
    const projectId = ProjectAllocationsId.newOne();
    const java = Capability.skill('JAVA-MID-JUNIOR');
    const javaOneDayDemand = new Demand(java, ONE_DAY_LONG);
    //and
    await riskSagaDispatcher.handle(
      event<ProjectAllocationsDemandsScheduled>(
        'ProjectAllocationsDemandsScheduled',
        {
          projectId,
          missingDemands: Demands.of(javaOneDayDemand),
        },
        clock,
      ),
    );

    //when
    await riskSagaDispatcher.handle(
      event<CapabilitiesAllocated>(
        'CapabilitiesAllocated',
        {
          projectId,
          allocatedCapabilityId: UUID.randomUUID(),
          missingDemands: Demands.none(),
        },
        clock,
      ),
    );

    //then
    verifyThat(notifyDemandsSatisfied).calledOnceWith(projectId);
  });

  void it('Informs about potential risk when resource taken over', async ({
    mock,
  }) => {
    const notifyAboutPossibleRisk = mock.method(
      riskPushNotification,
      'notifyAboutPossibleRisk',
    );
    //given
    const projectId = ProjectAllocationsId.newOne();
    const java = Capability.skill('JAVA-MID-JUNIOR');
    const javaOneDayDemand = new Demand(java, ONE_DAY_LONG);
    //and
    await riskSagaDispatcher.handle(
      event<ProjectAllocationsDemandsScheduled>(
        'ProjectAllocationsDemandsScheduled',
        {
          projectId,
          missingDemands: Demands.of(javaOneDayDemand),
        },
        clock,
      ),
    );
    //and
    await riskSagaDispatcher.handle(
      event<CapabilitiesAllocated>(
        'CapabilitiesAllocated',
        {
          allocatedCapabilityId: UUID.randomUUID(),
          projectId,
          missingDemands: Demands.none(),
        },
        clock,
      ),
    );
    //and
    await riskSagaDispatcher.handle(
      event<ProjectAllocationScheduled>(
        'ProjectAllocationScheduled',
        {
          projectId,
          fromTo: PROJECT_DATES,
        },
        clock,
      ),
    );

    //when
    notifyAboutPossibleRisk.mock.resetCalls();

    mock
      .method(clock, 'now')
      .mock.mockImplementation(() => itIsDaysBeforeDeadline(100));

    await riskSagaDispatcher.handle(
      event<ResourceTakenOver>(
        'ResourceTakenOver',
        {
          resourceId: ResourceId.newOne(),
          previousOwners: ObjectSet.of(Owner.of(projectId)),
          slot: ONE_DAY_LONG,
        },
        clock,
      ),
    );

    //then
    verifyThat(notifyAboutPossibleRisk).calledOnceWith(projectId);
  });

  void it('Does nothing when resource taken over from from unknown project', async ({
    mock,
  }) => {
    const mocks = [
      mock.method(riskPushNotification, 'notifyDemandsSatisfied'),
      mock.method(riskPushNotification, 'notifyProfitableRelocationFound'),
      mock.method(riskPushNotification, 'notifyAboutPossibleRisk'),
      mock.method(riskPushNotification, 'notifyAboutAvailability'),
      mock.method(
        riskPushNotification,
        'notifyAboutPossibleRiskDuringPlanning',
      ),
      mock.method(
        riskPushNotification,
        'notifyAboutCriticalResourceNotAvailable',
      ),
      mock.method(riskPushNotification, 'notifyAboutResourcesNotAvailable'),
    ];

    //given
    const unknown = ProjectId.newOne();
    //when
    await riskSagaDispatcher.handle(
      event<ResourceTakenOver>(
        'ResourceTakenOver',
        {
          resourceId: ResourceId.newOne(),
          previousOwners: ObjectSet.of(Owner.of(unknown)),
          slot: ONE_DAY_LONG,
        },
        clock,
      ),
    );

    //then
    mocks.forEach((mock) => verifyThat(mock).notCalled());
  });

  void it('Weekly check does nothing when not close to deadline and demands not satisfied', async ({
    mock,
  }) => {
    const mocks = [
      mock.method(riskPushNotification, 'notifyDemandsSatisfied'),
      mock.method(riskPushNotification, 'notifyProfitableRelocationFound'),
      mock.method(riskPushNotification, 'notifyAboutPossibleRisk'),
      mock.method(riskPushNotification, 'notifyAboutAvailability'),
      mock.method(
        riskPushNotification,
        'notifyAboutPossibleRiskDuringPlanning',
      ),
      mock.method(
        riskPushNotification,
        'notifyAboutCriticalResourceNotAvailable',
      ),
      mock.method(riskPushNotification, 'notifyAboutResourcesNotAvailable'),
    ];
    //given
    const projectId = ProjectAllocationsId.newOne();
    const java = Capability.skill('JAVA-MID-JUNIOR');
    const javaOneDayDemand = new Demand(java, ONE_DAY_LONG);
    //and
    await riskSagaDispatcher.handle(
      event<ProjectAllocationsDemandsScheduled>(
        'ProjectAllocationsDemandsScheduled',
        { projectId, missingDemands: Demands.of(javaOneDayDemand) },
        clock,
      ),
    );
    //and
    await riskSagaDispatcher.handle(
      event<ProjectAllocationScheduled>(
        'ProjectAllocationScheduled',
        { projectId, fromTo: PROJECT_DATES },
        clock,
      ),
    );

    //when
    mock
      .method(clock, 'now')
      .mock.mockImplementation(() => itIsDaysBeforeDeadline(100));

    await riskSagaDispatcher.handleWeeklyCheck();

    //then
    mocks.forEach((mock) => verifyThat(mock).notCalled());
  });

  void it('Weekly check does nothing when close to deadline and demands satisfied', async ({
    mock,
  }) => {
    const mocks = [
      mock.method(riskPushNotification, 'notifyDemandsSatisfied'),
      mock.method(riskPushNotification, 'notifyProfitableRelocationFound'),
      mock.method(riskPushNotification, 'notifyAboutPossibleRisk'),
      mock.method(riskPushNotification, 'notifyAboutAvailability'),
      mock.method(
        riskPushNotification,
        'notifyAboutPossibleRiskDuringPlanning',
      ),
      mock.method(
        riskPushNotification,
        'notifyAboutCriticalResourceNotAvailable',
      ),
      mock.method(riskPushNotification, 'notifyAboutResourcesNotAvailable'),
    ];
    //given
    const projectId = ProjectAllocationsId.newOne();
    const java = Capability.skill('JAVA-MID-JUNIOR-UNIQUE');
    const javaOneDayDemand = new Demand(java, ONE_DAY_LONG);
    await riskSagaDispatcher.handle(
      event<ProjectAllocationsDemandsScheduled>(
        'ProjectAllocationsDemandsScheduled',
        { projectId, missingDemands: Demands.of(javaOneDayDemand) },
        clock,
      ),
    );
    //and
    await riskSagaDispatcher.handle(
      event<EarningsRecalculated>(
        'EarningsRecalculated',
        { projectId, earnings: Earnings.of(10) },
        clock,
      ),
    );
    //and
    await riskSagaDispatcher.handle(
      event<CapabilitiesAllocated>(
        'CapabilitiesAllocated',
        {
          allocatedCapabilityId: UUID.randomUUID(),
          projectId,
          missingDemands: Demands.none(),
        },
        clock,
      ),
    );
    //and
    await riskSagaDispatcher.handle(
      event<ProjectAllocationScheduled>(
        'ProjectAllocationScheduled',
        { projectId, fromTo: PROJECT_DATES },
        clock,
      ),
    );

    //when
    mock
      .method(clock, 'now')
      .mock.mockImplementation(() => itIsDaysBeforeDeadline(100));
    mocks.forEach((mock) => mock.mock.resetCalls());

    await riskSagaDispatcher.handleWeeklyCheck();

    //then
    mocks.forEach((mock) => verifyThat(mock).notCalled());
  });

  void it('Find replacements when deadline close', async ({ mock }) => {
    const notifyAboutAvailability = mock.method(
      riskPushNotification,
      'notifyAboutAvailability',
    );
    const mocks = [
      mock.method(riskPushNotification, 'notifyDemandsSatisfied'),
      mock.method(riskPushNotification, 'notifyProfitableRelocationFound'),
      mock.method(riskPushNotification, 'notifyAboutPossibleRisk'),
      notifyAboutAvailability,
      mock.method(
        riskPushNotification,
        'notifyAboutPossibleRiskDuringPlanning',
      ),
      mock.method(
        riskPushNotification,
        'notifyAboutCriticalResourceNotAvailable',
      ),
      mock.method(riskPushNotification, 'notifyAboutResourcesNotAvailable'),
    ];
    //given
    const projectId = ProjectAllocationsId.newOne();
    const java = Capability.skill('JAVA-MID-JUNIOR');
    const javaOneDayDemand = new Demand(java, ONE_DAY_LONG);
    await riskSagaDispatcher.handle(
      event<ProjectAllocationsDemandsScheduled>(
        'ProjectAllocationsDemandsScheduled',
        { projectId, missingDemands: Demands.of(javaOneDayDemand) },
        clock,
      ),
    );
    //and
    await riskSagaDispatcher.handle(
      event<EarningsRecalculated>(
        'EarningsRecalculated',
        { projectId, earnings: Earnings.of(10) },
        clock,
      ),
    );
    //and
    await riskSagaDispatcher.handle(
      event<ProjectAllocationScheduled>(
        'ProjectAllocationScheduled',
        { projectId, fromTo: PROJECT_DATES },
        clock,
      ),
    );
    //and
    const employee = await thereIsEmployeeWithSkills(
      ObjectSet.of(java),
      ONE_DAY_LONG,
    );

    //when
    mocks.forEach((mock) => mock.mock.resetCalls());
    mock
      .method(clock, 'now')
      .mock.mockImplementation(() => itIsDaysBeforeDeadline(20));

    await riskSagaDispatcher.handleWeeklyCheck();

    //then
    verifyThat(notifyAboutAvailability).calledWithArgumentMatching(
      argValue(projectId),
      argMatches(employeeWasSuggestedForDemand(javaOneDayDemand, employee)),
    );
  });

  void it('Suggest resources from different projects', async ({ mock }) => {
    const notifyProfitableRelocationFound = mock.method(
      riskPushNotification,
      'notifyProfitableRelocationFound',
    );
    const mocks = [
      mock.method(riskPushNotification, 'notifyDemandsSatisfied'),
      notifyProfitableRelocationFound,
      mock.method(riskPushNotification, 'notifyAboutPossibleRisk'),
      mock.method(riskPushNotification, 'notifyAboutAvailability'),
      mock.method(
        riskPushNotification,
        'notifyAboutPossibleRiskDuringPlanning',
      ),
      mock.method(
        riskPushNotification,
        'notifyAboutCriticalResourceNotAvailable',
      ),
      mock.method(riskPushNotification, 'notifyAboutResourcesNotAvailable'),
    ];
    //given
    const highValueProject = ProjectAllocationsId.newOne();
    const lowValueProject = ProjectAllocationsId.newOne();
    //and
    const java = Capability.skill('JAVA-MID-JUNIOR-SUPER-UNIQUE');
    const javaOneDayDemand = new Demand(java, ONE_DAY_LONG);
    //and
    await allocationFacade.scheduleProjectAllocationDemands(
      highValueProject,
      Demands.of(javaOneDayDemand),
    );
    await cashFlowFacade.addIncomeAndCost(
      highValueProject,
      Income.of(10000),
      Cost.of(10),
    );
    await allocationFacade.scheduleProjectAllocationDemands(
      lowValueProject,
      Demands.of(javaOneDayDemand),
    );
    await cashFlowFacade.addIncomeAndCost(
      lowValueProject,
      Income.of(100),
      Cost.of(10),
    );
    //and
    const employee = await thereIsEmployeeWithSkills(
      ObjectSet.of(java),
      ONE_DAY_LONG,
    );
    await allocationFacade.allocateToProject(
      lowValueProject,
      employee,
      ONE_DAY_LONG,
    );
    //and
    await riskSagaDispatcher.handle(
      event<ProjectAllocationScheduled>(
        'ProjectAllocationScheduled',
        { projectId: highValueProject, fromTo: PROJECT_DATES },
        clock,
      ),
    );

    //when
    mocks.forEach((mock) => mock.mock.resetCalls());
    await allocationFacade.editProjectDates(highValueProject, PROJECT_DATES);
    await allocationFacade.editProjectDates(lowValueProject, PROJECT_DATES);
    mock
      .method(clock, 'now')
      .mock.mockImplementation(() => itIsDaysBeforeDeadline(1));
    await riskSagaDispatcher.handleWeeklyCheck();

    //then
    verifyThat(notifyProfitableRelocationFound).calledOnceWith(
      highValueProject,
      employee,
    );
  });

  const employeeWasSuggestedForDemand = (
    demand: Demand,
    allocatableCapabilityId: AllocatableCapabilityId,
  ) => {
    return (suggestions: ObjectMap<Demand, AllocatableCapabilitiesSummary>) =>
      suggestions
        .get(demand)!
        .all.some((suggestion) =>
          deepEquals(suggestion.id, allocatableCapabilityId),
        );
  };

  const thereIsEmployeeWithSkills = async (
    skills: ObjectSet<Capability>,
    inSlot: TimeSlot,
  ): Promise<AllocatableCapabilityId> => {
    const staszek = await employeeFacade.addEmployee(
      'Staszek',
      'Staszkowski',
      Seniority.MID,
      skills,
      Capability.permissions(),
    );
    const allocatableCapabilityIds = await employeeFacade.scheduleCapabilities(
      staszek,
      inSlot,
    );
    assertEquals(allocatableCapabilityIds.length, 1);
    return allocatableCapabilityIds[0];
  };

  const itIsDaysBeforeDeadline = (days: number) =>
    subDays(PROJECT_DATES.to, days);
});
