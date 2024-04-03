import type { Calendars } from '#availability';
import { TimeSlot } from '#shared';
import { ObjectMap } from '#utils';
import type { UTCDate } from '@date-fns/utc';
import { Stage, type ParallelStagesList } from '../parallelization';
import { ScheduleBasedOnChosenResourcesAvailabilityCalculator } from './scheduleBasedOnChosenResourcesAvailabilityCalculator';
import { ScheduleBasedOnReferenceStageCalculator } from './scheduleBasedOnReferenceStageCalculator';
import { ScheduleBasedOnStartDayCalculator } from './scheduleBasedOnStartDayCalculator';

export class Schedule {
  constructor(public readonly dates: ObjectMap<string, TimeSlot>) {}

  public static none = () => new Schedule(ObjectMap.empty());

  public static basedOnStartDay = (
    startDate: UTCDate,
    parallelizedStages: ParallelStagesList,
  ): Schedule => {
    const scheduleMap = ScheduleBasedOnStartDayCalculator.calculate(
      startDate,
      parallelizedStages,
      (a, b) => a.print().localeCompare(b.print()),
    );
    return new Schedule(scheduleMap);
  };

  public static basedOnReferenceStageTimeSlot = (
    referenceStage: Stage,
    stageProposedTimeSlot: TimeSlot,
    parallelizedStages: ParallelStagesList,
  ): Schedule => {
    const scheduleMap = ScheduleBasedOnReferenceStageCalculator.calculate(
      referenceStage,
      stageProposedTimeSlot,
      parallelizedStages,
      (a, b) => a.print().localeCompare(b.print()),
    );
    return new Schedule(scheduleMap);
  };

  public static basedOnChosenResourcesAvailability = (
    chosenResourcesCalendars: Calendars,
    stages: Stage[],
  ): Schedule => {
    const schedule =
      ScheduleBasedOnChosenResourcesAvailabilityCalculator.calculate(
        chosenResourcesCalendars,
        stages,
      );
    return new Schedule(schedule);
  };
}
