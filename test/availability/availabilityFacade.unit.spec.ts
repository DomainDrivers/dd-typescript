/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  AvailabilityFacade,
  Owner,
  ResourceAvailabilityId,
} from '#availability';
import { TimeSlot } from '#shared';
import { addMinutes } from 'date-fns';
import assert from 'node:assert';
import { describe, it } from 'node:test';

describe('AvailabilityFacade', () => {
  const availabilityFacade = new AvailabilityFacade();

  it('can create availability slots', () => {
    //given
    const resourceId = ResourceAvailabilityId.newOne();
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);

    //when
    availabilityFacade.createResourceSlots(resourceId, oneDay);

    //then
    //todo check that availability(ies) was/were created
  });

  it('can block availabilities', () => {
    //given
    const resourceId = ResourceAvailabilityId.newOne();
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const owner = Owner.newOne();
    availabilityFacade.createResourceSlots(resourceId, oneDay);

    //when
    const result = availabilityFacade.block(resourceId, oneDay, owner);

    //then
    assert.ok(result);
    //todo check that can't be taken
  });

  it('can disable availabilities', () => {
    //given
    const resourceId = ResourceAvailabilityId.newOne();
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const owner = Owner.newOne();
    availabilityFacade.createResourceSlots(resourceId, oneDay);

    //when
    const result = availabilityFacade.disable(resourceId, oneDay, owner);

    //then
    assert.ok(result);
    //todo check that are disabled
  });

  it('cant block even when just small segment of requested slot is blocked', () => {
    //given
    const resourceId = ResourceAvailabilityId.newOne();
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const owner = Owner.newOne();
    availabilityFacade.createResourceSlots(resourceId, oneDay);
    //and
    availabilityFacade.block(resourceId, oneDay, owner);
    const fifteenMinutes = new TimeSlot(
      oneDay.from,
      addMinutes(oneDay.from, 15),
    );

    //when
    const result = availabilityFacade.block(
      resourceId,
      fifteenMinutes,
      Owner.newOne(),
    );

    //then
    assert.equal(result, false);
    //todo check that nothing was changed
  });

  it('can release availability', () => {
    //given
    const resourceId = ResourceAvailabilityId.newOne();
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const fifteenMinutes = new TimeSlot(
      oneDay.from,
      addMinutes(oneDay.from, 15),
    );
    const owner = Owner.newOne();
    availabilityFacade.createResourceSlots(resourceId, fifteenMinutes);
    //and
    availabilityFacade.block(resourceId, fifteenMinutes, owner);

    //when
    const result = availabilityFacade.release(resourceId, oneDay, owner);

    //then
    assert.ok(result);
    //todo check can be taken again
  });

  it('cant release even when just part of slot is owned by the requester', () => {
    //given
    const resourceId = ResourceAvailabilityId.newOne();
    const jan_1 = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const jan_2 = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 2);
    const jan_1_2 = new TimeSlot(jan_1.from, jan_2.to);
    const jan1owner = Owner.newOne();
    availabilityFacade.createResourceSlots(resourceId, jan_1_2);
    //and
    availabilityFacade.block(resourceId, jan_1, jan1owner);
    //and
    const jan2owner = Owner.newOne();
    availabilityFacade.block(resourceId, jan_2, jan2owner);

    //when
    const result = availabilityFacade.release(resourceId, jan_1_2, jan1owner);

    //then
    assert.equal(result, false);
    //todo check still owned by jan1
  });
});
