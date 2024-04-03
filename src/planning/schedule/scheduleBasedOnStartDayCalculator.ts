import { TimeSlot } from '#shared';
import { ObjectMap } from '#utils';
import type { UTCDate } from '@date-fns/utc';
import { addMilliseconds, isAfter } from 'date-fns';
import { ParallelStages, type ParallelStagesList } from '../parallelization';

export const ScheduleBasedOnStartDayCalculator = {
  calculate: (
    startDate: UTCDate,
    parallelizedStages: ParallelStagesList,
    comparing: (a: ParallelStages, b: ParallelStages) => number,
  ): ObjectMap<string, TimeSlot> => {
    const scheduleMap = ObjectMap.empty<string, TimeSlot>();
    let currentStart = startDate;
    const allSorted: ParallelStages[] = parallelizedStages.allSorted(comparing);

    for (const stages of allSorted) {
      let parallelizedStagesEnd = currentStart;
      for (const stage of stages.stages) {
        const stageEnd = addMilliseconds(currentStart, stage.duration);
        scheduleMap.set(stage.name, new TimeSlot(currentStart, stageEnd));
        if (isAfter(stageEnd, parallelizedStagesEnd)) {
          parallelizedStagesEnd = stageEnd;
        }
      }
      currentStart = parallelizedStagesEnd;
    }

    return scheduleMap;
  },
};
