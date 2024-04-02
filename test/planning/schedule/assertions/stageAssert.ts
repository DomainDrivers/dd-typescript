import { UTCDate } from '@date-fns/utc';
import { isAfter, isBefore, isEqual } from 'date-fns';
import assert from 'node:assert';
import { type TimeSlot } from '../../../../src/planning/schedule';
import type { ScheduleAssert } from './scheduleAssert';
import { deepEquals } from '../../../../src/utils';

export class StageAssert {
  constructor(
    private timeSlot: TimeSlot,
    private scheduleAssert?: ScheduleAssert,
  ) {}

  public thatStarts = (start: string): StageAssert => {
    assert.ok(isEqual(this.timeSlot.from, new UTCDate(start)));
    return this;
  };

  public withSlot = (slot: TimeSlot): StageAssert => {
    assert.ok(deepEquals(this.timeSlot, slot));
    return this;
  };

  public thatEnds = (end: string): StageAssert => {
    assert.ok(isEqual(this.timeSlot.to, new UTCDate(end)));
    return this;
  };

  public and = (): ScheduleAssert => this.scheduleAssert!;

  public isBefore = (stage: string) => {
    const schedule = this.scheduleAssert!.schedule;
    assert.ok(
      isBefore(this.timeSlot.to, schedule.dates.get(stage)!.from) ||
        isEqual(this.timeSlot.to, schedule.dates.get(stage)!.from),
    );
    return this;
  };

  public startsTogetherWith = (stage: string): StageAssert => {
    const schedule = this.scheduleAssert!.schedule;
    assert.ok(isEqual(this.timeSlot.from, schedule.dates.get(stage)!.from));
    return this;
  };

  public isAfter = (stage: string): StageAssert => {
    const schedule = this.scheduleAssert!.schedule;
    assert.ok(
      isAfter(this.timeSlot.from, schedule.dates.get(stage)!.to) ||
        isEqual(this.timeSlot.from, schedule.dates.get(stage)!.to),
    );
    return this;
  };
}
