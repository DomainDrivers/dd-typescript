import {
  Demand,
  Demands,
  PlanningConfiguration,
  RedisConfiguration,
  type PlanningFacade,
} from '#planning';
import { EmployeeConfiguration, EmployeeFacade, Seniority } from '#resource';
import { RiskConfiguration, RiskPushNotification } from '#risk';
import * as schema from '#schema';
import { Capability } from '#shared';
import type Redis from 'ioredis';
import { after, before, beforeEach, describe, it } from 'node:test';
import { argValue, verifyThat } from '../asserts';
import { TestConfiguration } from '../setup';

const SENIOR = Seniority.SENIOR;
const skill = Capability.skill;

void describe('VerifyEnoughDemandsDuringPlanning', () => {
  let testEnvironment: TestConfiguration;
  let employeeFacade: EmployeeFacade;
  let riskPushNotification: RiskPushNotification;
  let planningFacade: PlanningFacade;
  let connectionString: string;
  let redisClient: Redis;

  before(async () => {
    testEnvironment = TestConfiguration(undefined, undefined, true);
    const configuration = await testEnvironment.start(
      {
        schema,
      },
      true,
    );
    connectionString = configuration.connectionString;
    redisClient = configuration.redisClient!;
  });

  beforeEach(async () => {
    const employeeConfiguration = new EmployeeConfiguration(
      connectionString,
      testEnvironment.utilsConfiguration,
    );
    employeeFacade = employeeConfiguration.employeeFacade();

    const redisConfiguration = new RedisConfiguration(redisClient!);

    planningFacade = new PlanningConfiguration(
      redisConfiguration,
      connectionString,
      testEnvironment.utilsConfiguration,
    ).planningFacade();

    riskPushNotification = new RiskPushNotification();

    const _riskConfiguration = new RiskConfiguration(
      connectionString,
      redisClient!,
      {
        utilsConfiguration: testEnvironment.utilsConfiguration,
        riskPushNotification,
      },
    );
    await testEnvironment.clearTestData();
  });

  after(async () => await testEnvironment.stop());

  void it('Does nothing when enough resources', async ({ mock }) => {
    const notifyAboutPossibleRiskDuringPlanning = mock.method(
      riskPushNotification,
      'notifyAboutPossibleRiskDuringPlanning',
    );

    //given
    await employeeFacade.addEmployee(
      'resourceName',
      'lastName',
      SENIOR,
      Capability.skills('JAVA5', 'PYTHON'),
      Capability.permissions(),
    );
    await employeeFacade.addEmployee(
      'resourceName',
      'lastName',
      SENIOR,
      Capability.skills('C#', 'RUST'),
      Capability.permissions(),
    );
    //and
    const projectId = await planningFacade.addNewProject('java5');

    //when
    await planningFacade.addDemands(
      projectId,
      Demands.of(new Demand(skill('JAVA5'))),
    );

    // then
    verifyThat(
      notifyAboutPossibleRiskDuringPlanning,
    ).notCalledWithArgumentMatching(
      argValue(projectId),
      argValue(Demands.of(Demand.demandFor(skill('JAVA')))),
    );
  });

  void it('notifies when not enough resources', async ({ mock }) => {
    const notifyAboutPossibleRiskDuringPlanning = mock.method(
      riskPushNotification,
      'notifyAboutPossibleRiskDuringPlanning',
    );
    //given
    await employeeFacade.addEmployee(
      'resourceName',
      'lastName',
      SENIOR,
      Capability.skills('JAVA'),
      Capability.permissions(),
    );
    await employeeFacade.addEmployee(
      'resourceName',
      'lastName',
      SENIOR,
      Capability.skills('C'),
      Capability.permissions(),
    );
    //and
    const java = await planningFacade.addNewProject('java');
    const c = await planningFacade.addNewProject('C');
    //and
    await planningFacade.addDemands(
      java,
      Demands.of(new Demand(skill('JAVA'))),
    );
    await planningFacade.addDemands(c, Demands.of(new Demand(skill('C'))));
    //when
    const rust = await planningFacade.addNewProject('rust');
    await planningFacade.addDemands(
      rust,
      Demands.of(new Demand(skill('RUST'))),
    );

    //then
    verifyThat(
      notifyAboutPossibleRiskDuringPlanning,
    ).calledWithArgumentMatching(
      argValue(rust),
      argValue(Demands.of(Demand.demandFor(skill('RUST')))),
    );
  });
});
