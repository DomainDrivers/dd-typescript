/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  AvailabilityConfiguration,
  AvailabilityFacade,
  Owner,
  ResourceId,
} from '#availability';
import * as schema from '#schema';
import { TimeSlot } from '#shared';
import { addMinutes } from 'date-fns';
import { after, before, describe, it } from 'node:test';
import { ObjectSet } from '../../src/utils';
import { assertThatArray } from '../asserts';
import { TestConfiguration } from '../setup';

describe('AvailabilityFacade', () => {
  const testEnvironment = TestConfiguration();
  let availabilityFacade: AvailabilityFacade;

  before(async () => {
    const connectionString = await testEnvironment.start({ schema });

    const configuration = new AvailabilityConfiguration(connectionString);

    availabilityFacade = configuration.availabilityFacade();
  });

  after(testEnvironment.stop);

  it('loads calendar for entire month', async () => {
    //given
    const resourceId = ResourceId.newOne();
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const fifteenMinutes = new TimeSlot(
      addMinutes(oneDay.from, 15),
      addMinutes(oneDay.from, 30),
    );
    const owner = Owner.newOne();
    //and
    await availabilityFacade.createResourceSlots(resourceId, oneDay);

    //when
    await availabilityFacade.block(resourceId, fifteenMinutes, owner);

    //then
    const calendar = await availabilityFacade.loadCalendar(resourceId, oneDay);
    assertThatArray(calendar.takenBy(owner)).containsExactly(fifteenMinutes);
    assertThatArray(
      calendar.availableSlots(),
    ).containsExactlyInAnyOrderElementsOf(
      oneDay.leftoverAfterRemovingCommonWith(fifteenMinutes),
    );
  });

  it('loads calendar for multiple resources', async () => {
    //given
    const resourceId = ResourceId.newOne();
    const resourceId2 = ResourceId.newOne();
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const fifteenMinutes = new TimeSlot(
      addMinutes(oneDay.from, 15),
      addMinutes(oneDay.from, 30),
    );

    const owner = Owner.newOne();
    await availabilityFacade.createResourceSlots(resourceId, oneDay);
    await availabilityFacade.createResourceSlots(resourceId2, oneDay);

    //when
    await availabilityFacade.block(resourceId, fifteenMinutes, owner);
    await availabilityFacade.block(resourceId2, fifteenMinutes, owner);

    //then
    const calendars = await availabilityFacade.loadCalendars(
      ObjectSet.from([resourceId, resourceId2]),
      oneDay,
    );
    assertThatArray(calendars.get(resourceId).takenBy(owner)).containsExactly(
      fifteenMinutes,
    );
    assertThatArray(calendars.get(resourceId2).takenBy(owner)).containsExactly(
      fifteenMinutes,
    );
    assertThatArray(
      calendars.get(resourceId).availableSlots(),
    ).containsExactlyInAnyOrderElementsOf(
      oneDay.leftoverAfterRemovingCommonWith(fifteenMinutes),
    );
    assertThatArray(
      calendars.get(resourceId2).availableSlots(),
    ).containsExactlyInAnyOrderElementsOf(
      oneDay.leftoverAfterRemovingCommonWith(fifteenMinutes),
    );
  });
});
