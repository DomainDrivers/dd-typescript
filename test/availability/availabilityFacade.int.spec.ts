import {
  AvailabilityConfiguration,
  AvailabilityFacade,
  Calendar,
  Owner,
  ResourceId,
  Segments,
  type ResourceTakenOver,
} from '#availability';
import * as schema from '#schema';
import { TimeSlot } from '#shared';
import { Duration, ObjectSet } from '#utils';
import { addMinutes } from 'date-fns';
import assert from 'node:assert';
import { after, afterEach, before, describe, it } from 'node:test';
import {
  assertFalse,
  assertThat,
  assertThatArray,
  assertTrue,
} from '../asserts';
import { TestConfiguration } from '../setup';

void describe('AvailabilityFacade', () => {
  const testEnvironment = TestConfiguration();
  let availabilityFacade: AvailabilityFacade;

  before(async () => {
    const { connectionString } = await testEnvironment.start({ schema });

    const configuration = new AvailabilityConfiguration(
      connectionString,
      testEnvironment.utilsConfiguration,
    );

    availabilityFacade = configuration.availabilityFacade();
  });

  afterEach(testEnvironment.clearTestData);

  after(testEnvironment.stop);

  void it('can create availability slots', async () => {
    //given
    const resourceId = ResourceId.newOne();
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);

    //when
    await availabilityFacade.createResourceSlots(resourceId, oneDay);

    //then
    const entireMonth = TimeSlot.createMonthlyTimeSlotAtUTC(2021, 1);
    const monthlyCalendar = await availabilityFacade.loadCalendar(
      resourceId,
      entireMonth,
    );
    assertThat(monthlyCalendar).isEqualTo(
      Calendar.withAvailableSlots(resourceId, oneDay),
    );
  });

  void it('can create new availability slots with parent id', async () => {
    //given
    const resourceId = ResourceId.newOne();
    const resourceId2 = ResourceId.newOne();
    const parentId = ResourceId.newOne();
    const differentParentId = ResourceId.newOne();
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);

    //when
    await availabilityFacade.createResourceSlots(resourceId, oneDay, parentId);
    await availabilityFacade.createResourceSlots(
      resourceId2,
      oneDay,
      differentParentId,
    );

    //then
    assertTrue(
      (
        await availabilityFacade.findByParentId(parentId, oneDay)
      ).isEntirelyWithParentId(parentId),
    );
    assertTrue(
      (
        await availabilityFacade.findByParentId(differentParentId, oneDay)
      ).isEntirelyWithParentId(differentParentId),
    );
  });

  void it('can block availabilities', async () => {
    //given
    const resourceId = ResourceId.newOne();
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const owner = Owner.newOne();
    await availabilityFacade.createResourceSlots(resourceId, oneDay);

    //when
    const result = await availabilityFacade.block(resourceId, oneDay, owner);

    //then
    assert.ok(result);
    const entireMonth = TimeSlot.createMonthlyTimeSlotAtUTC(2021, 1);
    const monthlyCalendar = await availabilityFacade.loadCalendar(
      resourceId,
      entireMonth,
    );
    assertThatArray(monthlyCalendar.availableSlots()).isEmpty();
    assertThatArray(monthlyCalendar.takenBy(owner)).containsExactly(oneDay);
  });

  void it('cant block when no slots created', async () => {
    //given
    const resourceId = ResourceId.newOne();
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const owner = Owner.newOne();

    //when
    const result = await availabilityFacade.block(resourceId, oneDay, owner);

    //then
    assertFalse(result);
  });

  void it('can disable availabilities', async () => {
    //given
    const resourceId = ResourceId.newOne();
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const owner = Owner.newOne();
    await availabilityFacade.createResourceSlots(resourceId, oneDay);

    //when
    const result = await availabilityFacade.disable(resourceId, oneDay, owner);

    //then
    assert.ok(result);
    const resourceAvailabilities = await availabilityFacade.find(
      resourceId,
      oneDay,
    );
    assert.ok(resourceAvailabilities.isDisabledEntirelyBy(owner));
    const entireMonth = TimeSlot.createMonthlyTimeSlotAtUTC(2021, 1);
    const monthlyCalendar = await availabilityFacade.loadCalendar(
      resourceId,
      entireMonth,
    );
    assertThatArray(monthlyCalendar.availableSlots()).isEmpty();
    assertThatArray(monthlyCalendar.takenBy(owner)).containsExactly(oneDay);
  });

  void it(`can't disable when no slots created`, async () => {
    //given
    const resourceId = ResourceId.newOne();
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const owner = Owner.newOne();

    //when
    const result = await availabilityFacade.disable(resourceId, oneDay, owner);

    //then
    assertFalse(result);
  });

  void it('cant block even when just small segment of requested slot is blocked', async () => {
    //given
    const resourceId = ResourceId.newOne();
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const owner = Owner.newOne();
    await availabilityFacade.createResourceSlots(resourceId, oneDay);
    //and
    await availabilityFacade.block(resourceId, oneDay, owner);
    const fifteenMinutes = new TimeSlot(
      oneDay.from,
      addMinutes(oneDay.from, 15),
    );

    //when
    const result = await availabilityFacade.block(
      resourceId,
      fifteenMinutes,
      Owner.newOne(),
    );

    //then
    assert.equal(result, false);
    const resourceAvailabilities = await availabilityFacade.find(
      resourceId,
      oneDay,
    );
    assert.ok(resourceAvailabilities.blockedEntirelyBy(owner));
  });

  void it('can release availability', async () => {
    //given
    const resourceId = ResourceId.newOne();
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const fifteenMinutes = new TimeSlot(
      oneDay.from,
      addMinutes(oneDay.from, 15),
    );
    const owner = Owner.newOne();
    await availabilityFacade.createResourceSlots(resourceId, fifteenMinutes);
    //and
    await availabilityFacade.block(resourceId, fifteenMinutes, owner);

    //when
    const result = await availabilityFacade.release(resourceId, oneDay, owner);

    //then
    assert.ok(result);
    const resourceAvailabilities = await availabilityFacade.find(
      resourceId,
      oneDay,
    );
    assert.ok(resourceAvailabilities.isEntirelyAvailable());
  });

  void it(`can't release when no slots created`, async () => {
    //given
    const resourceId = ResourceId.newOne();
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const owner = Owner.newOne();

    //when
    const result = await availabilityFacade.release(resourceId, oneDay, owner);

    //then
    assertFalse(result);
  });

  void it(`can't release even when just part of slot is owned by the requester`, async () => {
    //given
    const resourceId = ResourceId.newOne();
    const jan_1 = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const jan_2 = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 2);
    const jan_1_2 = new TimeSlot(jan_1.from, jan_2.to);
    const jan1owner = Owner.newOne();
    await availabilityFacade.createResourceSlots(resourceId, jan_1_2);
    //and
    await availabilityFacade.block(resourceId, jan_1, jan1owner);
    //and
    const jan2owner = Owner.newOne();
    await availabilityFacade.block(resourceId, jan_2, jan2owner);

    //when
    const result = await availabilityFacade.release(
      resourceId,
      jan_1_2,
      jan1owner,
    );

    //then
    assert.equal(result, false);
    const resourceAvailability = await availabilityFacade.find(
      resourceId,
      jan_1,
    );
    assert.ok(resourceAvailability.blockedEntirelyBy(jan1owner));
  });

  void it('one segment can be taken by someone else after realising', async () => {
    const resourceId = ResourceId.newOne();
    const durationOfSevenSlots = Duration.ofMinutes(
      7 * Segments.DEFAULT_SEGMENT_DURATION_IN_MINUTES,
    );
    const sevenSlots = TimeSlot.createTimeSlotAtUTCOfDuration(
      2021,
      1,
      1,
      durationOfSevenSlots,
    );
    const minimumSlot = new TimeSlot(
      sevenSlots.from,
      addMinutes(sevenSlots.from, Segments.DEFAULT_SEGMENT_DURATION_IN_MINUTES),
    );
    const owner = Owner.newOne();
    await availabilityFacade.createResourceSlots(resourceId, sevenSlots);
    //and
    await availabilityFacade.block(resourceId, sevenSlots, owner);
    //and
    await availabilityFacade.release(resourceId, minimumSlot, owner);

    //when
    const newRequester = Owner.newOne();
    const result = await availabilityFacade.block(
      resourceId,
      minimumSlot,
      newRequester,
    );

    //then
    assertTrue(result);
    const entireCalendar = await availabilityFacade.loadCalendar(
      resourceId,
      sevenSlots,
    );
    assertThatArray(entireCalendar.availableSlots()).isEmpty();
    assertThatArray(entireCalendar.takenBy(owner)).containsExactlyElementsOf(
      sevenSlots.leftoverAfterRemovingCommonWith(minimumSlot),
    );
    assertThatArray(entireCalendar.takenBy(newRequester)).containsExactly(
      minimumSlot,
    );
  });

  void it('Resource taken over event is emitted after taking over the resource', async () => {
    //given
    const resourceId = ResourceId.newOne();
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const initialOwner = Owner.newOne();
    const newOwner = Owner.newOne();
    await availabilityFacade.createResourceSlots(resourceId, oneDay);
    await availabilityFacade.block(resourceId, oneDay, initialOwner);

    //when
    const result = await availabilityFacade.disable(
      resourceId,
      oneDay,
      newOwner,
    );

    //then
    assertTrue(result);
    testEnvironment.eventBus.verifyPublishedEvent<ResourceTakenOver>(
      'ResourceTakenOver',
      {
        resourceId,
        previousOwners: ObjectSet.of(initialOwner),
        slot: oneDay,
      },
    );
  });
});
