import { TimeSlot } from '#shared';
import { ObjectMap } from '#utils';
import { addMilliseconds } from 'date-fns';
import { ParallelStages, ParallelStagesList, Stage } from '../parallelization';

const calculateStagesBeforeCritical = (
  before: ParallelStages[],
  stageProposedTimeSlot: TimeSlot,
  scheduleMap: ObjectMap<string, TimeSlot>,
): ObjectMap<string, TimeSlot> => {
  const currentStart = stageProposedTimeSlot.from;
  for (let i = before.length - 1; i >= 0; i--) {
    const currentStages = before[i];
    const stageDuration = currentStages.duration();
    const start = addMilliseconds(currentStart, -stageDuration);
    for (const stage of currentStages.stages) {
      scheduleMap.set(
        stage.name,
        new TimeSlot(start, addMilliseconds(start, stage.duration)),
      );
    }
  }
  return scheduleMap;
};

const calculateStagesAfterCritical = (
  after: ParallelStages[],
  stageProposedTimeSlot: TimeSlot,
  scheduleMap: ObjectMap<string, TimeSlot>,
): ObjectMap<string, TimeSlot> => {
  let currentStart = stageProposedTimeSlot.to;
  for (const currentStages of after) {
    for (const stage of currentStages.stages) {
      scheduleMap.set(
        stage.name,
        new TimeSlot(
          currentStart,
          addMilliseconds(currentStart, stage.duration),
        ),
      );
    }
    currentStart = addMilliseconds(currentStart, currentStages.duration());
  }
  return scheduleMap;
};

const calculateStagesWithReferenceStage = (
  stagesWithReference: ParallelStages,
  stageProposedTimeSlot: TimeSlot,
  scheduleMap: ObjectMap<string, TimeSlot>,
): ObjectMap<string, TimeSlot> => {
  const currentStart = stageProposedTimeSlot.from;
  for (const stage of stagesWithReference.stages) {
    scheduleMap.set(
      stage.name,
      new TimeSlot(currentStart, addMilliseconds(currentStart, stage.duration)),
    );
  }
  return scheduleMap;
};

const findReferenceStageIndex = (
  referenceStage: Stage,
  all: ParallelStages[],
): number => {
  let stagesWithTheReferenceStageWithProposedTimeIndex = -1;
  for (let i = 0; i < all.length; i++) {
    const stages = all[i];
    const stagesNames: Set<string> = new Set(
      stages.stages.map((stage) => stage.name),
    );
    if (stagesNames.has(referenceStage.name)) {
      stagesWithTheReferenceStageWithProposedTimeIndex = i;
      break;
    }
  }
  return stagesWithTheReferenceStageWithProposedTimeIndex;
};

export const ScheduleBasedOnReferenceStageCalculator = {
  calculate: (
    referenceStage: Stage,
    referenceStageProposedTimeSlot: TimeSlot,
    parallelizedStages: ParallelStagesList,
    comparing: (a: ParallelStages, b: ParallelStages) => number,
  ): ObjectMap<string, TimeSlot> => {
    const all: ParallelStages[] = parallelizedStages.allSorted(comparing);
    const referenceStageIndex: number = findReferenceStageIndex(
      referenceStage,
      all,
    );
    if (referenceStageIndex === -1) {
      return ObjectMap.empty();
    }
    const scheduleMap = ObjectMap.empty<string, TimeSlot>();
    const stagesBeforeReference = all.slice(0, referenceStageIndex);
    const stagesAfterReference = all.slice(referenceStageIndex + 1, all.length);
    calculateStagesBeforeCritical(
      stagesBeforeReference,
      referenceStageProposedTimeSlot,
      scheduleMap,
    );
    calculateStagesAfterCritical(
      stagesAfterReference,
      referenceStageProposedTimeSlot,
      scheduleMap,
    );
    calculateStagesWithReferenceStage(
      all[referenceStageIndex],
      referenceStageProposedTimeSlot,
      scheduleMap,
    );
    return scheduleMap;
  },
};
