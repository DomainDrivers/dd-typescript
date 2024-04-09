/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Demand,
  PlanningConfiguration,
  RedisConfiguration,
  Stage,
  schema,
  type PlanningFacade,
} from '#planning';
import { Capability, TimeSlot } from '#shared';
import { Duration } from '#utils';
import { UTCDate } from '@date-fns/utc';
import { after, before, describe, it } from 'node:test';
import { TestConfiguration } from '../setup';
import { ScheduleAssert } from './schedule/assertions';

const ofDays = Duration.ofDays;
const demandFor = Demand.demandFor;
const skill = Capability.skill;
const assertThat = ScheduleAssert.assertThat;

void describe('Time Critical Waterfall', () => {
  const testEnvironment = TestConfiguration();
  let projectFacade: PlanningFacade;

  const JAN_1_5 = new TimeSlot(
    new UTCDate('2020-01-01T00:00:00.00Z'),
    new UTCDate('2020-01-05T00:00:00.00Z'),
  );
  const JAN_1_3 = new TimeSlot(
    new UTCDate('2020-01-01T00:00:00.00Z'),
    new UTCDate('2020-01-03T00:00:00Z'),
  );
  const JAN_1_4 = new TimeSlot(
    new UTCDate('2020-01-01T00:00:00.00Z'),
    new UTCDate('2020-01-04T00:00:00Z'),
  );

  before(async () => {
    const { connectionString, redisClient } = await testEnvironment.start(
      { schema },
      true,
    );

    const configuration = new PlanningConfiguration(
      new RedisConfiguration(redisClient!),
      connectionString,
    );

    projectFacade = configuration.planningFacade();
  });

  after(testEnvironment.stop);

  void it('time critical waterfall project process', async () => {
    //given
    const projectId = await projectFacade.addNewProject('waterfall');
    //and
    const stageBeforeCritical = new Stage('stage1').ofDuration(
      Duration.ofDays(2),
    );
    const criticalStage = new Stage('stage2').ofDuration(JAN_1_5.duration());
    const stageAfterCritical = new Stage('stage3').ofDuration(
      Duration.ofDays(3),
    );
    await projectFacade.defineProjectStages(
      projectId,
      stageBeforeCritical,
      criticalStage,
      stageAfterCritical,
    );

    //when
    await projectFacade.planCriticalStage(projectId, criticalStage, JAN_1_5);

    //then
    const project = await projectFacade.load(projectId);
    const schedule = project.schedule;
    assertThat(schedule)
      .hasStage('stage1')
      .withSlot(JAN_1_3)
      .and()
      .hasStage('stage2')
      .withSlot(JAN_1_5)
      .and()
      .hasStage('stage3')
      .withSlot(JAN_1_4);
  });
});
