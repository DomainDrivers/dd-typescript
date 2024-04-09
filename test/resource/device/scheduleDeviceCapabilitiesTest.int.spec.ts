import {
  CapabilityPlanningConfiguration,
  type CapabilityFinder,
} from '#allocation';
import { DeviceConfiguration, type DeviceFacade } from '#resource';
import * as schema from '#schema';
import { Capability, TimeSlot } from '#shared';
import { after, before, describe, it } from 'node:test';
import { assertEquals } from '../../asserts';
import { TestConfiguration } from '../../setup';

void describe('ScheduleDeviceCapabilities', () => {
  const testEnvironment = TestConfiguration();
  let deviceFacade: DeviceFacade;
  let capabilityFinder: CapabilityFinder;

  before(async () => {
    const { connectionString } = await testEnvironment.start({ schema });

    const configuration = new DeviceConfiguration(
      connectionString,
      testEnvironment.utilsConfiguration,
    );

    capabilityFinder = new CapabilityPlanningConfiguration(
      connectionString,
    ).capabilityFinder();

    deviceFacade = configuration.deviceFacade();
  });

  after(testEnvironment.stop);

  void it('Can setup capabilities according to policy', async () => {
    //given
    const device = await deviceFacade.createDevice(
      'super-bulldozer-3000',
      Capability.assets('EXCAVATOR', 'BULLDOZER'),
    );
    //when
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const allocations = await deviceFacade.scheduleCapabilities(device, oneDay);

    //then
    const loaded = await capabilityFinder.findAllById(allocations);
    assertEquals(allocations.length, loaded.all.length);
  });
});
