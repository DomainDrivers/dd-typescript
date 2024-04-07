/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  AllocatableCapabilitySummary,
  AllocatableResourceId,
  CapabilityFinder,
  CapabilityPlanningConfiguration,
  CapabilityScheduler,
  CapabilitySelector,
  toAvailabilityResourceId,
} from '#allocation';
import { AvailabilityFacade } from '#availability';
import * as schema from '#schema';
import { Capability, TimeSlot } from '#shared';
import { ObjectSet, deepEquals } from '#utils';
import { addSeconds } from 'date-fns';
import { after, before, describe, it } from 'node:test';
import {
  assertEquals,
  assertIsNotNull,
  assertIsNull,
  assertThatArray,
} from '../../asserts';
import { TestConfiguration } from '../../setup';

describe('CapabilityScheduling', () => {
  const testEnvironment = TestConfiguration();
  let capabilityScheduler: CapabilityScheduler;
  let capabilityFinder: CapabilityFinder;
  let availabilityFacade: AvailabilityFacade;

  before(async () => {
    const connectionString = await testEnvironment.start({ schema });

    const configuration = new CapabilityPlanningConfiguration(connectionString);

    availabilityFacade = configuration.availabilityFacade();
    capabilityScheduler = configuration.capabilityScheduler();
    capabilityFinder = configuration.capabilityFinder();
  });

  after(async () => await testEnvironment.stop());

  const availabilitySlotsAreCreated = async (
    allocatableCapability: AllocatableCapabilitySummary,
    oneDay: TimeSlot,
  ): Promise<boolean> => {
    const calendar = await availabilityFacade.loadCalendar(
      toAvailabilityResourceId(allocatableCapability.id),
      oneDay,
    );
    return deepEquals(calendar.availableSlots(), [oneDay]);
  };

  it('can schedule allocatable capabilities', async () => {
    //given
    const javaSkill = CapabilitySelector.canJustPerform(
      Capability.skill('JAVA'),
    );
    const rustSkill = CapabilitySelector.canJustPerform(
      Capability.skill('RUST'),
    );
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);

    //when
    const allocatable =
      await capabilityScheduler.scheduleResourceCapabilitiesForPeriod(
        AllocatableResourceId.newOne(),
        [javaSkill, rustSkill],
        oneDay,
      );

    //then
    const loaded = await capabilityFinder.findById(allocatable);
    assertEquals(allocatable.length, loaded.all.length);

    await assertThatArray(loaded.all).allMatchAsync((allocatableCapability) =>
      availabilitySlotsAreCreated(allocatableCapability, oneDay),
    );
  });

  it('capability is found when capability present in time slot', async () => {
    //given
    const fitnessClass = Capability.permission('FITNESS-CLASS');
    const uniqueSkill = CapabilitySelector.canJustPerform(fitnessClass);
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const anotherDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 2);
    //and
    await capabilityScheduler.scheduleResourceCapabilitiesForPeriod(
      AllocatableResourceId.newOne(),
      [uniqueSkill],
      oneDay,
    );

    //when
    const found = await capabilityFinder.findAvailableCapabilities(
      fitnessClass,
      oneDay,
    );
    const notFound = await capabilityFinder.findAvailableCapabilities(
      fitnessClass,
      anotherDay,
    );

    //then
    assertEquals(found.all.length, 1);
    assertThatArray(notFound.all).isEmpty();
    assertEquals(found.all[0].capabilities, uniqueSkill);
    assertEquals(found.all[0].timeSlot, oneDay);
  });

  it('capability not found when capability not present', async () => {
    //given
    const admin = CapabilitySelector.canJustPerform(
      Capability.permission('ADMIN'),
    );
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    //and
    await capabilityScheduler.scheduleResourceCapabilitiesForPeriod(
      AllocatableResourceId.newOne(),
      [admin],
      oneDay,
    );

    //when
    const rust = Capability.skill('RUST JUST FOR NINJAS');
    const found = await capabilityFinder.findCapabilities(rust, oneDay);

    //then
    assertThatArray(found.all).isEmpty();
  });

  it('can schedule multiple capabilities of same type', async () => {
    //given
    const loading = Capability.skill('LOADING_TRUCK');
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    //and
    const truck1 = AllocatableResourceId.newOne();
    const truck2 = AllocatableResourceId.newOne();
    const truck3 = AllocatableResourceId.newOne();
    await capabilityScheduler.scheduleMultipleResourcesForPeriod(
      ObjectSet.from([truck1, truck2, truck3]),
      loading,
      oneDay,
    );

    //when
    const found = await capabilityFinder.findCapabilities(loading, oneDay);

    //then
    assertThatArray(found.all).hasSize(3);
  });

  it('can find capability ignoring availability', async () => {
    //given
    const adminPermission = Capability.permission('REALLY_UNIQUE_ADMIN');
    const admin = CapabilitySelector.canJustPerform(adminPermission);
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(1111, 1, 1);
    const differentDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 2, 1);
    const hourWithinDay = new TimeSlot(
      oneDay.from,
      addSeconds(oneDay.from, 3600),
    );
    const partiallyOverlappingDay = new TimeSlot(
      addSeconds(oneDay.from, 3600),
      addSeconds(oneDay.to, 3600),
    );
    //and
    await capabilityScheduler.scheduleResourceCapabilitiesForPeriod(
      AllocatableResourceId.newOne(),
      [admin],
      oneDay,
    );

    //when
    const onTheExactDay = await capabilityFinder.findCapabilities(
      adminPermission,
      oneDay,
    );
    const onDifferentDay = await capabilityFinder.findCapabilities(
      adminPermission,
      differentDay,
    );
    const inSlotWithin = await capabilityFinder.findCapabilities(
      adminPermission,
      hourWithinDay,
    );
    const inOverlappingSlot = await capabilityFinder.findCapabilities(
      adminPermission,
      partiallyOverlappingDay,
    );

    //then
    assertThatArray(onTheExactDay.all).hasSize(1);
    assertThatArray(inSlotWithin.all).hasSize(1);
    assertThatArray(onDifferentDay.all).isEmpty();
    assertThatArray(inOverlappingSlot.all).isEmpty();
  });

  it('Finding takes into account simulations capabilities', async () => {
    //given
    const truckAssets = ObjectSet.of(
      Capability.asset('LOADING'),
      Capability.asset('CARRYING'),
    );
    const truckCapabilities =
      CapabilitySelector.canPerformAllAtTheTime(truckAssets);
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(1111, 1, 1);
    //and
    const truckResourceId = AllocatableResourceId.newOne();
    await capabilityScheduler.scheduleResourceCapabilitiesForPeriod(
      truckResourceId,
      [truckCapabilities],
      oneDay,
    );

    //when
    const canPerformBoth = await capabilityScheduler.findResourceCapabilities(
      truckResourceId,
      truckAssets,
      oneDay,
    );
    const canPerformJustLoading =
      await capabilityScheduler.findResourceCapabilities(
        truckResourceId,
        Capability.asset('CARRYING'),
        oneDay,
      );
    const canPerformJustCarrying =
      await capabilityScheduler.findResourceCapabilities(
        truckResourceId,
        Capability.asset('LOADING'),
        oneDay,
      );
    const cantPerformJava = await capabilityScheduler.findResourceCapabilities(
      truckResourceId,
      Capability.skill('JAVA'),
      oneDay,
    );

    //then
    assertIsNotNull(canPerformBoth);
    assertIsNotNull(canPerformJustLoading);
    assertIsNotNull(canPerformJustCarrying);
    assertIsNull(cantPerformJava);
  });
});
