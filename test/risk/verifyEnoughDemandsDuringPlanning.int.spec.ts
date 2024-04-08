import {
  Demand,
  Demands,
  PlanningConfiguration,
  type PlanningFacade,
} from '#planning';
import { EmployeeConfiguration, EmployeeFacade, Seniority } from '#resource';
import { RiskConfiguration, RiskPushNotification } from '#risk';
import * as schema from '#schema';
import { Capability } from '#shared';
import { after, before, describe, it } from 'node:test';
import { verifyThat } from '../asserts';
import { TestConfiguration } from '../setup';

const SENIOR = Seniority.SENIOR;
const skill = Capability.skill;

void describe('VerifyEnoughDemandsDuringPlanning', () => {
  const testEnvironment = TestConfiguration();
  let employeeFacade: EmployeeFacade;
  let riskPushNotification: RiskPushNotification;
  let planningFacade: PlanningFacade;

  before(async () => {
    const connectionString = await testEnvironment.start({ schema });

    const employeeConfiguration = new EmployeeConfiguration(connectionString);
    employeeFacade = employeeConfiguration.employeeFacade();

    planningFacade = new PlanningConfiguration(
      connectionString,
      testEnvironment.utilsConfiguration,
    ).planningFacade();

    riskPushNotification = new RiskPushNotification();

    const _riskConfiguration = new RiskConfiguration(connectionString, {
      utilsConfiguration: testEnvironment.utilsConfiguration,
      riskPushNotification,
    });
  });

  after(testEnvironment.stop);

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
    verifyThat(notifyAboutPossibleRiskDuringPlanning).calledOnceWith(
      projectId,
      Demands.of(Demand.demandFor(skill('JAVA'))),
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
    verifyThat(notifyAboutPossibleRiskDuringPlanning).calledOnceWith(
      rust,
      Demands.of(Demand.demandFor(skill('RUST'))),
    );
  });
});
