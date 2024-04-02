/* eslint-disable @typescript-eslint/no-floating-promises */

import { UTCDate } from '@date-fns/utc';
import { describe, it } from 'node:test';
import {
  ParallelStages,
  ParallelStagesList,
  Stage,
  type ResourceName,
} from '../../../src/planning/parallelization';
import {
  Calendar,
  Calendars,
  Schedule,
  TimeSlot,
} from '../../../src/planning/schedule';
import { Duration } from '../../../src/utils';
import { ScheduleAssert } from './assertions/scheduleAssert';

const ofDays = Duration.ofDays;
const assertThat = ScheduleAssert.assertThat;

describe('ScheduleCalculation', () => {
  const JAN_1 = new UTCDate('2020-01-01T00:00:00.00Z');
  const JAN_10_20 = new TimeSlot(
    new UTCDate('2020-01-10T00:00:00.00Z'),
    new UTCDate('2020-01-20T00:00:00.00Z'),
  );
  const JAN_1_1 = new TimeSlot(
    new UTCDate('2020-01-01T00:00:00.00Z'),
    new UTCDate('2020-01-02T00:00:00.00Z'),
  );
  const JAN_3_10 = new TimeSlot(
    new UTCDate('2020-01-03T00:00:00.00Z'),
    new UTCDate('2020-01-10T00:00:00.00Z'),
  );
  const JAN_1_20 = new TimeSlot(
    new UTCDate('2020-01-01T00:00:00.00Z'),
    new UTCDate('2020-01-20T00:00:00.00Z'),
  );
  const JAN_11_21 = new TimeSlot(
    new UTCDate('2020-01-11T00:00:00.00Z'),
    new UTCDate('2020-01-21T00:00:00.00Z'),
  );
  const JAN_1_4 = new TimeSlot(
    new UTCDate('2020-01-01T00:00:00.00Z'),
    new UTCDate('2020-01-04T00:00:00.00Z'),
  );
  const JAN_4_14 = new TimeSlot(
    new UTCDate('2020-01-04T00:00:00.00Z'),
    new UTCDate('2020-01-14T00:00:00.00Z'),
  );
  const JAN_14_16 = new TimeSlot(
    new UTCDate('2020-01-14T00:00:00.00Z'),
    new UTCDate('2020-01-16T00:00:00.00Z'),
  );
  const JAN_1_5 = new TimeSlot(
    new UTCDate('2020-01-01T00:00:00.00Z'),
    new UTCDate('2020-01-05T00:00:00.00Z'),
  );
  const DEC_29_JAN_1 = new TimeSlot(
    new UTCDate('2019-12-29T00:00:00.00Z'),
    new UTCDate('2020-01-01T00:00:00.00Z'),
  );
  const JAN_1_11 = new TimeSlot(
    new UTCDate('2020-01-01T00:00:00.00Z'),
    new UTCDate('2020-01-11T00:00:00.00Z'),
  );
  const JAN_5_7 = new TimeSlot(
    new UTCDate('2020-01-05T00:00:00.00Z'),
    new UTCDate('2020-01-07T00:00:00.00Z'),
  );
  const JAN_3_6 = new TimeSlot(
    new UTCDate('2020-01-03T00:00:00.00Z'),
    new UTCDate('2020-01-06T00:00:00.00Z'),
  );

  it('can calculate schedule based on the start day', () => {
    //given
    const stage1 = new Stage('Stage1').ofDuration(ofDays(3));
    const stage2 = new Stage('Stage2').ofDuration(ofDays(10));
    const stage3 = new Stage('Stage3').ofDuration(ofDays(2));
    //and
    const parallelStages = ParallelStagesList.of(
      ParallelStages.of(stage1),
      ParallelStages.of(stage2),
      ParallelStages.of(stage3),
    );

    //when
    const schedule = Schedule.basedOnStartDay(JAN_1, parallelStages);

    //then
    assertThat(schedule)
      .hasStage('Stage1')
      .withSlot(JAN_1_4)
      .and()
      .hasStage('Stage2')
      .withSlot(JAN_4_14)
      .and()
      .hasStage('Stage3')
      .withSlot(JAN_14_16);
  });

  it('schedule can adjust to dates of one reference stage', () => {
    //given
    const stage = new Stage('S1').ofDuration(ofDays(3));
    const anotherStage = new Stage('S2').ofDuration(ofDays(10));
    const yetAnotherStage = new Stage('S3').ofDuration(ofDays(2));
    const referenceStage = new Stage('S4-Reference').ofDuration(ofDays(4));
    //and
    const parallelStages = ParallelStagesList.of(
      ParallelStages.of(stage),
      ParallelStages.of(referenceStage, anotherStage),
      ParallelStages.of(yetAnotherStage),
    );

    //when
    const schedule = Schedule.basedOnReferenceStageTimeSlot(
      referenceStage,
      JAN_1_5,
      parallelStages,
    );

    //then
    assertThat(schedule)
      .hasStage('S1')
      .withSlot(DEC_29_JAN_1)
      .isBefore('S4-Reference')
      .and()
      .hasStage('S2')
      .withSlot(JAN_1_11)
      .startsTogetherWith('S4-Reference')
      .and()
      .hasStage('S3')
      .withSlot(JAN_5_7)
      .isAfter('S4-Reference')
      .and()
      .hasStage('S4-Reference')
      .withSlot(JAN_1_5);
  });

  it('no schedule is calculated if reference stage to adjust to does not exist', () => {
    //given
    const stage1 = new Stage('Stage1').ofDuration(ofDays(3));
    const stage2 = new Stage('Stage2').ofDuration(ofDays(10));
    const stage3 = new Stage('Stage3').ofDuration(ofDays(2));
    const stage4 = new Stage('Stage4').ofDuration(ofDays(4));
    //and
    const parallelStages = ParallelStagesList.of(
      ParallelStages.of(stage1),
      ParallelStages.of(stage2, stage4),
      ParallelStages.of(stage3),
    );

    //when
    const schedule = Schedule.basedOnReferenceStageTimeSlot(
      new Stage('Stage5'),
      JAN_1_5,
      parallelStages,
    );

    //then
    assertThat(schedule).isEmpty();
  });

  it('can adjust schedule to availability of needed resources', () => {
    //given
    const r1: ResourceName = { name: 'r1' };
    const r2: ResourceName = { name: 'r2' };
    const r3: ResourceName = { name: 'r3' };
    //and
    const stage1 = new Stage('Stage1')
      .ofDuration(ofDays(3))
      .withChosenResourceCapabilities(r1);
    const stage2 = new Stage('Stage2')
      .ofDuration(ofDays(10))
      .withChosenResourceCapabilities(r2, r3);
    //and
    const cal1 = Calendar.withAvailableSlots(r1, JAN_1_1, JAN_3_10);
    const cal2 = Calendar.withAvailableSlots(r2, JAN_1_20);
    const cal3 = Calendar.withAvailableSlots(r3, JAN_11_21);

    //when
    const schedule = Schedule.basedOnChosenResourcesAvailability(
      Calendars.of(cal1, cal2, cal3),
      [stage1, stage2],
    );

    //then
    assertThat(schedule)
      .hasStage('Stage1')
      .withSlot(JAN_3_6)
      .and()
      .hasStage('Stage2')
      .withSlot(JAN_10_20);
  });
});
