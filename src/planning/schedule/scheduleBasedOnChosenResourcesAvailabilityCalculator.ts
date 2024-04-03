import { Calendars } from '#availability';
import { TimeSlot } from '#shared';
import { Duration, ObjectMap, compareDuration } from '#utils';
import { addMilliseconds, differenceInMilliseconds } from 'date-fns';
import { Stage } from '../parallelization';

const isSlotLongEnoughForStage = (stage: Stage, slot: TimeSlot): boolean =>
  compareDuration(slot.duration(), stage.duration) >= 0;

const findCommonPartOfSlots = (foundSlots: TimeSlot[]): TimeSlot =>
  foundSlots.length > 0
    ? foundSlots.reduce((prev, current) => prev.commonPartWith(current))
    : TimeSlot.empty();

const possibleSlots = (
  chosenResourcesCalendars: Calendars,
  stage: Stage,
): TimeSlot[] =>
  stage.resources.map(
    (resource) =>
      chosenResourcesCalendars
        .get(resource)
        .availableSlots()
        .sort((a, b) => differenceInMilliseconds(a.from, b.from))
        .find((slot) => isSlotLongEnoughForStage(stage, slot)) ??
      TimeSlot.empty(),
  );

const findSlotForStage = (
  chosenResourcesCalendars: Calendars,
  stage: Stage,
): TimeSlot => {
  const foundSlots = possibleSlots(chosenResourcesCalendars, stage);
  if (foundSlots.some((s) => s.equals(TimeSlot.empty()))) {
    return TimeSlot.empty();
  }
  let commonSlotForAllResources = findCommonPartOfSlots(foundSlots);
  while (!isSlotLongEnoughForStage(stage, commonSlotForAllResources)) {
    commonSlotForAllResources = commonSlotForAllResources.stretch(
      Duration.ofDays(1),
    );
  }
  return new TimeSlot(
    commonSlotForAllResources.from,
    addMilliseconds(commonSlotForAllResources.from, stage.duration),
  );
};

export const ScheduleBasedOnChosenResourcesAvailabilityCalculator = {
  calculate: (
    chosenResourcesCalendars: Calendars,
    stages: Stage[],
  ): ObjectMap<string, TimeSlot> => {
    const schedule = ObjectMap.empty<string, TimeSlot>();
    for (const stage of stages) {
      const proposedSlot: TimeSlot = findSlotForStage(
        chosenResourcesCalendars,
        stage,
      );
      if (proposedSlot.equals(TimeSlot.empty())) {
        return ObjectMap.empty();
      }
      schedule.set(stage.name, proposedSlot);
    }
    return schedule;
  },
};
