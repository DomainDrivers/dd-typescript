import type { UTCDate } from '@date-fns/utc';
import { ObjectMap } from '../../utils';
import type { ParallelStagesList } from '../parallelization';
import { ParallelStages } from '../parallelization/parallelStages';
import type { TimeSlot } from './timeSlot';

export const ScheduleBasedOnStartDayCalculator = {
  calculate: (
    startDate: UTCDate,
    parallelizedStages: ParallelStagesList,
    comparing: (a: ParallelStages, b: ParallelStages) => number,
  ): ObjectMap<string, TimeSlot> => {
    const scheduleMap = ObjectMap.empty<string, TimeSlot>();
    const _currentStart = startDate;
    const _allSorted: ParallelStages[] =
      parallelizedStages.allSorted(comparing);
    //TODO
    return scheduleMap;
  },
};
