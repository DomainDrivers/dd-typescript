import {
  Demand,
  Demands,
  NotSatisfiedDemands,
  ProjectAllocationsId,
  type ProjectAllocationScheduled,
} from '#allocation';
import { Owner, ResourceId, type ResourceTakenOver } from '#availability';
import {
  RiskConfiguration,
  RiskPushNotification,
  type RiskPeriodicCheckSagaDispatcher,
} from '#risk';
import * as schema from '#schema';
import { Capability, TimeSlot } from '#shared';
import { Clock, ObjectMap, ObjectSet, event } from '#utils';
import { UTCDate } from '@date-fns/utc';
import { addDays, subDays } from 'date-fns';
import { after, before, beforeEach, describe, it } from 'node:test';
import { verifyThat } from '../asserts';
import { TestConfiguration } from '../setup';

void describe('RiskPeriodicCheckSagaDispatcherE2E', () => {
  const testEnvironment = TestConfiguration();
  let riskSagaDispatcher: RiskPeriodicCheckSagaDispatcher;
  let riskPushNotification: RiskPushNotification;
  let clock: Clock;

  const ONE_DAY_LONG = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
  const PROJECT_DATES = new TimeSlot(new UTCDate(), addDays(new UTCDate(), 20));

  before(async () => {
    const connectionString = await testEnvironment.start({ schema });

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
      NotSatisfiedDemands.forOneProject(
        projectId,
        Demands.of(javaOneDayDemand),
      ),
    );

    //when
    await riskSagaDispatcher.handle(
      NotSatisfiedDemands.allSatisfied(projectId),
    );

    //then
    verifyThat(notifyDemandsSatisfied).calledOnceWith(projectId);
  });

  void it('Informs about demand satisfied for all projects', async ({
    mock,
  }) => {
    const notifyDemandsSatisfied = mock.method(
      riskPushNotification,
      'notifyDemandsSatisfied',
    );
    //given
    const projectId = ProjectAllocationsId.newOne();
    const projectId2 = ProjectAllocationsId.newOne();
    //and
    const noMissingDemands = ObjectMap.from([
      [projectId, Demands.none()],
      [projectId2, Demands.none()],
    ]);

    //when
    await riskSagaDispatcher.handle(
      event<NotSatisfiedDemands>(
        'NotSatisfiedDemands',
        {
          missingDemands: noMissingDemands,
        },
        clock,
      ),
    );

    //then
    verifyThat(notifyDemandsSatisfied).calledOnceWith(projectId);
    verifyThat(notifyDemandsSatisfied).calledOnceWith(projectId2);
  });

  void it('Informs about potential risk when resource taken over', async ({
    mock,
  }) => {
    const notifyAboutPossibleRisk = mock.method(
      riskPushNotification,
      'notifyAboutPossibleRisk',
    );
    const mocks = [
      mock.method(riskPushNotification, 'notifyDemandsSatisfied'),
      mock.method(riskPushNotification, 'notifyProfitableRelocationFound'),
      notifyAboutPossibleRisk,
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
      NotSatisfiedDemands.forOneProject(
        projectId,
        Demands.of(javaOneDayDemand),
        clock.now(),
      ),
    );
    //and
    await riskSagaDispatcher.handle(
      NotSatisfiedDemands.allSatisfied(projectId, clock.now()),
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
    mocks.forEach((mock) => mock.mock.resetCalls());
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

  const itIsDaysBeforeDeadline = (days: number) =>
    subDays(PROJECT_DATES.to, days);
});
