/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  CapabilityPlanningConfiguration,
  type CapabilityFinder,
} from '#allocation';
import {
  EmployeeConfiguration,
  Seniority,
  type EmployeeFacade,
} from '#resource';
import * as schema from '#schema';
import { Capability, TimeSlot } from '#shared';
import { after, before, describe, it } from 'node:test';
import { assertEquals } from '../../asserts';
import { TestConfiguration } from '../../setup';

describe('ScheduleEmployeeCapabilities', () => {
  const testEnvironment = TestConfiguration();
  let employeeFacade: EmployeeFacade;
  let capabilityFinder: CapabilityFinder;

  before(async () => {
    const connectionString = await testEnvironment.start({ schema });

    const configuration = new EmployeeConfiguration(connectionString);

    employeeFacade = configuration.employeeFacade();
    capabilityFinder = new CapabilityPlanningConfiguration(
      connectionString,
    ).capabilityFinder();
  });

  after(testEnvironment.stop);

  it('can create and load employees', async () => {
    //given
    const employee = await employeeFacade.addEmployee(
      'resourceName',
      'lastName',
      Seniority.LEAD,
      Capability.skills('JAVA, PYTHON'),
      Capability.permissions('ADMIN'),
    );
    //when
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const allocations = await employeeFacade.scheduleCapabilities(
      employee,
      oneDay,
    );

    //then
    const loaded = await capabilityFinder.findAllById(allocations);
    assertEquals(allocations.length, loaded.all.length);
  });
});
