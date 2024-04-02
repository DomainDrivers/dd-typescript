import assert from 'node:assert';
import { Schedule } from '../../../../src/planning/schedule';
import { deepEquals } from '../../../../src/utils';
import { StageAssert } from './stageAssert';

export class ScheduleAssert {
  constructor(public schedule: Schedule) {}

  public static assertThat = (actual: Schedule) => new ScheduleAssert(actual);

  public hasStages = (number: number): ScheduleAssert => {
    assert.equal(this.schedule.dates.length, number);
    return this;
  };

  public hasStage = (name: string): StageAssert => {
    const stageTimeSlot = this.schedule.dates.get(name);
    assert.notEqual(stageTimeSlot, null);
    return new StageAssert(stageTimeSlot!, this);
  };

  public isEmpty = () => {
    assert.ok(deepEquals(this.schedule, Schedule.none()));
  };
}
