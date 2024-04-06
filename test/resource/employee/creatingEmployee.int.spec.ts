/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  EmployeeConfiguration,
  Seniority,
  type EmployeeFacade,
} from '#resource';
import * as schema from '#schema';
import { Capability } from '#shared';
import { after, before, describe, it } from 'node:test';
import { assertEquals, assertThatArray } from '../../asserts';
import { TestConfiguration } from '../../setup';

const SENIOR = Seniority.SENIOR;

describe('CreatingEmployee', () => {
  const testEnvironment = TestConfiguration();
  let employeeFacade: EmployeeFacade;

  before(async () => {
    const connectionString = await testEnvironment.start({ schema });

    const configuration = new EmployeeConfiguration(connectionString);

    employeeFacade = configuration.employeeFacade();
  });

  after(testEnvironment.stop);

  it('can create and load employees', async () => {
    //given
    const employee = await employeeFacade.addEmployee(
      'resourceName',
      'lastName',
      SENIOR,
      Capability.skills('JAVA, PYTHON'),
      Capability.permissions('ADMIN, COURT'),
    );

    //when
    const loaded = await employeeFacade.findEmployee(employee);

    //then
    assertThatArray(loaded.skills).containsOnlyOnceElementsOf(
      Capability.skills('JAVA, PYTHON'),
    );
    assertEquals(Capability.permissions('ADMIN, COURT'), loaded.permissions);
    assertEquals('resourceName', loaded.name);
    assertEquals('lastName', loaded.lastName);
    assertEquals(SENIOR, loaded.seniority);
  });

  it('can find all capabilities', async () => {
    //given
    employeeFacade.addEmployee(
      'staszek',
      'lastName',
      SENIOR,
      Capability.skills('JAVA12', 'PYTHON21'),
      Capability.permissions('ADMIN1', 'COURT1'),
    );
    employeeFacade.addEmployee(
      'leon',
      'lastName',
      SENIOR,
      Capability.skills('JAVA12', 'PYTHON21'),
      Capability.permissions('ADMIN2', 'COURT2'),
    );
    employeeFacade.addEmployee(
      'sławek',
      'lastName',
      SENIOR,
      Capability.skills('JAVA12', 'PYTHON21'),
      Capability.permissions('ADMIN3', 'COURT3'),
    );

    //when
    const loaded = await employeeFacade.findAllCapabilities();

    //then
    assertThatArray(loaded).containsElements(
      Capability.permission('ADMIN1'),
      Capability.permission('ADMIN2'),
      Capability.permission('ADMIN3'),
      Capability.permission('COURT1'),
      Capability.permission('COURT2'),
      Capability.permission('COURT3'),
      Capability.skill('JAVA12'),
      Capability.skill('JAVA12'),
      Capability.skill('JAVA12'),
      Capability.skill('PYTHON21'),
      Capability.skill('PYTHON21'),
      Capability.skill('PYTHON21'),
    );
  });
});
