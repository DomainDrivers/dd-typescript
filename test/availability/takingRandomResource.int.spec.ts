import {
  AvailabilityConfiguration,
  AvailabilityFacade,
  Owner,
  ResourceId,
} from '#availability';
import * as schema from '#schema';
import { TimeSlot } from '#shared';
import { ObjectSet, deepEquals } from '#utils';
import { after, before, describe, it } from 'node:test';
import {
  assertIsNotNull,
  assertIsNull,
  assertThatArray,
  assertTrue,
} from '../asserts';
import { TestConfiguration } from '../setup';

void describe('TakingRandomResource', () => {
  const testEnvironment = TestConfiguration();
  let availabilityFacade: AvailabilityFacade;

  before(async () => {
    const { connectionString } = await testEnvironment.start({ schema });

    const configuration = new AvailabilityConfiguration(connectionString);

    availabilityFacade = configuration.availabilityFacade();
  });

  after(testEnvironment.stop);

  void it('Can take random resource from pool', async () => {
    //given
    const resourceId = ResourceId.newOne();
    const resourceId2 = ResourceId.newOne();
    const resourceId3 = ResourceId.newOne();
    const resourcesPool = ObjectSet.of(resourceId, resourceId2, resourceId3);
    //and
    const owner1 = Owner.newOne();
    const owner2 = Owner.newOne();
    const owner3 = Owner.newOne();
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);

    //and
    await availabilityFacade.createResourceSlots(resourceId, oneDay);
    await availabilityFacade.createResourceSlots(resourceId2, oneDay);
    await availabilityFacade.createResourceSlots(resourceId3, oneDay);

    //when
    const taken1 = await availabilityFacade.blockRandomAvailable(
      resourcesPool,
      oneDay,
      owner1,
    );

    //then
    assertIsNotNull(taken1);
    assertTrue(resourcesPool.has(taken1));
    await assertThatResourceIsTakeByOwner(taken1, owner1, oneDay);

    //when
    const taken2 = await availabilityFacade.blockRandomAvailable(
      resourcesPool,
      oneDay,
      owner2,
    );

    //then
    assertIsNotNull(taken2);
    assertTrue(resourcesPool.has(taken2));
    await assertThatResourceIsTakeByOwner(taken2, owner2, oneDay);

    //when
    const taken3 = await availabilityFacade.blockRandomAvailable(
      resourcesPool,
      oneDay,
      owner3,
    );

    //then
    assertIsNotNull(taken3);
    assertTrue(resourcesPool.has(taken3));
    await assertThatResourceIsTakeByOwner(taken3, owner3, oneDay);

    //when
    const taken4 = await availabilityFacade.blockRandomAvailable(
      resourcesPool,
      oneDay,
      owner3,
    );

    //then
    assertIsNull(taken4);
  });

  void it('Nothing is taken when no resource in pool', async () => {
    //given
    const resources = ObjectSet.of(
      ResourceId.newOne(),
      ResourceId.newOne(),
      ResourceId.newOne(),
    );

    //when
    const jan_1 = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const taken1 = await availabilityFacade.blockRandomAvailable(
      resources,
      jan_1,
      Owner.newOne(),
    );

    //then
    assertIsNull(taken1);
  });

  const assertThatResourceIsTakeByOwner = async (
    resourceId: ResourceId,
    owner: Owner,
    oneDay: TimeSlot,
  ): Promise<void> => {
    const resourceAvailability = await availabilityFacade.find(
      resourceId,
      oneDay,
    );
    assertThatArray(resourceAvailability.availabilities).allMatch((ra) =>
      deepEquals(ra.blockedBy(), owner),
    );
  };
});
