import {
  AvailabilityConfiguration,
  AvailabilityFacade,
  Owner,
  ResourceId,
  Segments,
} from '#availability';
import * as schema from '#schema';
import { TimeSlot } from '#shared';
import { Duration, ObjectSet } from '#utils';
import { addMinutes } from 'date-fns';
import { after, before, beforeEach, describe, it } from 'node:test';
import { assertThatArray } from '../asserts';
import { TestConfiguration } from '../setup';

const DEFAULT_SEGMENT_DURATION_IN_MINUTES =
  Segments.DEFAULT_SEGMENT_DURATION_IN_MINUTES;

void describe('AvailabilityFacade', () => {
  const testEnvironment = TestConfiguration();
  let availabilityFacade: AvailabilityFacade;

  before(async () => {
    const { connectionString } = await testEnvironment.start({ schema });

    const configuration = new AvailabilityConfiguration(connectionString);

    availabilityFacade = configuration.availabilityFacade();
  });

  beforeEach(testEnvironment.clearTestData);

  after(testEnvironment.stop);

  void it('loads calendar for entire month', async () => {
    //given
    const resourceId = ResourceId.newOne();
    const durationOfSevenSlots = Duration.ofMinutes(
      7 * DEFAULT_SEGMENT_DURATION_IN_MINUTES,
    );
    const sevenSlots = TimeSlot.createTimeSlotAtUTCOfDuration(
      2021,
      1,
      1,
      durationOfSevenSlots,
    );
    const minimumSlot = new TimeSlot(
      sevenSlots.from,
      addMinutes(sevenSlots.from, DEFAULT_SEGMENT_DURATION_IN_MINUTES),
    );
    const owner = Owner.newOne();
    //and
    await availabilityFacade.createResourceSlots(resourceId, sevenSlots);

    //when
    await availabilityFacade.block(resourceId, minimumSlot, owner);

    //then
    const calendar = await availabilityFacade.loadCalendar(
      resourceId,
      sevenSlots,
    );
    assertThatArray(calendar.takenBy(owner)).containsExactly(minimumSlot);
    assertThatArray(
      calendar.availableSlots(),
    ).containsExactlyInAnyOrderElementsOf(
      sevenSlots.leftoverAfterRemovingCommonWith(minimumSlot),
    );
  });

  void it('loads calendar for multiple resources', async () => {
    //given
    const resourceId = ResourceId.newOne();
    const resourceId2 = ResourceId.newOne();
    const durationOfSevenSlots = Duration.ofMinutes(
      7 * DEFAULT_SEGMENT_DURATION_IN_MINUTES,
    );
    const sevenSlots = TimeSlot.createTimeSlotAtUTCOfDuration(
      2021,
      1,
      1,
      durationOfSevenSlots,
    );
    const minimumSlot = new TimeSlot(
      sevenSlots.from,
      addMinutes(sevenSlots.from, DEFAULT_SEGMENT_DURATION_IN_MINUTES),
    );

    const owner = Owner.newOne();
    await availabilityFacade.createResourceSlots(resourceId, sevenSlots);
    await availabilityFacade.createResourceSlots(resourceId2, sevenSlots);

    //when
    await availabilityFacade.block(resourceId, minimumSlot, owner);
    await availabilityFacade.block(resourceId2, minimumSlot, owner);

    //then
    const calendars = await availabilityFacade.loadCalendars(
      ObjectSet.from([resourceId, resourceId2]),
      sevenSlots,
    );
    assertThatArray(calendars.get(resourceId).takenBy(owner)).containsExactly(
      minimumSlot,
    );
    assertThatArray(calendars.get(resourceId2).takenBy(owner)).containsExactly(
      minimumSlot,
    );
    assertThatArray(
      calendars.get(resourceId).availableSlots(),
    ).containsExactlyInAnyOrderElementsOf(
      sevenSlots.leftoverAfterRemovingCommonWith(minimumSlot),
    );
    assertThatArray(
      calendars.get(resourceId2).availableSlots(),
    ).containsExactlyInAnyOrderElementsOf(
      sevenSlots.leftoverAfterRemovingCommonWith(minimumSlot),
    );
  });
});
