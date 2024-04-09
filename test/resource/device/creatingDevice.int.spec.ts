import { DeviceConfiguration, type DeviceFacade } from '#resource';
import * as schema from '#schema';
import { Capability } from '#shared';
import { after, before, describe, it } from 'node:test';
import { assertEquals, assertThatArray } from '../../asserts';
import { TestConfiguration } from '../../setup';

const assets = Capability.assets;

void describe('CreatingDevice', () => {
  const testEnvironment = TestConfiguration();
  let deviceFacade: DeviceFacade;

  before(async () => {
    const { connectionString } = await testEnvironment.start({ schema });

    const configuration = new DeviceConfiguration(
      connectionString,
      testEnvironment.utilsConfiguration,
    );

    deviceFacade = configuration.deviceFacade();
  });

  after(testEnvironment.stop);

  void it('can create and load devices', async () => {
    //given
    const device = await deviceFacade.createDevice(
      'super-excavator-1000',
      assets('BULLDOZER', 'EXCAVATOR'),
    );

    //when
    const loaded = await deviceFacade.findDevice(device);

    //then
    assertThatArray(loaded.assets).containsExactlyElementsOf(
      assets('BULLDOZER', 'EXCAVATOR'),
    );
    assertEquals('super-excavator-1000', loaded.model);
  });

  void it('can find all capabilities', async () => {
    //given
    await deviceFacade.createDevice(
      'super-excavator-1000',
      assets('SMALL-EXCAVATOR', 'BULLDOZER'),
    );
    await deviceFacade.createDevice(
      'super-excavator-2000',
      assets('MEDIUM-EXCAVATOR', 'UBER-BULLDOZER'),
    );
    await deviceFacade.createDevice(
      'super-excavator-3000',
      assets('BIG-EXCAVATOR'),
    );

    //when
    const loaded = await deviceFacade.findAllCapabilities();

    //then
    assertThatArray(loaded).containsElements(
      Capability.asset('SMALL-EXCAVATOR'),
      Capability.asset('BULLDOZER'),
      Capability.asset('MEDIUM-EXCAVATOR'),
      Capability.asset('UBER-BULLDOZER'),
      Capability.asset('BIG-EXCAVATOR'),
    );
  });
});
