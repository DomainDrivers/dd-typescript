/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { ResourceId } from '#availability';
import {
  PlanningConfiguration,
  ProjectId,
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

const assertThat = ScheduleAssert.assertThat;

describe('Specialized Waterfall', () => {
  const testEnvironment = TestConfiguration();
  let projectFacade: PlanningFacade;

  const JAN_1_2 = new TimeSlot(
    new UTCDate('2020-01-01T00:00:00.00Z'),
    new UTCDate('2020-01-02T00:00:00Z'),
  );
  const JAN_1_4 = new TimeSlot(
    new UTCDate('2020-01-01T00:00:00.00Z'),
    new UTCDate('2020-01-04T00:00:00Z'),
  );
  const JAN_1_5 = new TimeSlot(
    new UTCDate('2020-01-01T00:00:00.00Z'),
    new UTCDate('2020-01-05T00:00:00Z'),
  );
  const JAN_1_6 = new TimeSlot(
    new UTCDate('2020-01-01T00:00:00.00Z'),
    new UTCDate('2020-01-06T00:00:00Z'),
  );
  const JAN_4_8 = new TimeSlot(
    new UTCDate('2020-01-04T00:00:00.00Z'),
    new UTCDate('2020-01-08T00:00:00Z'),
  );

  before(async () => {
    const connectionString = await testEnvironment.start({ schema });

    const configuration = new PlanningConfiguration(connectionString);

    projectFacade = configuration.planningFacade();
  });

  after(testEnvironment.stop);

  it(
    'specialized waterfall project process',
    { skip: 'not implemented yet' },
    async () => {
      //given
      const projectId = await projectFacade.addNewProject('waterfall');
      //and
      const criticalStageDuration = Duration.ofDays(5);
      const stage1Duration = Duration.ofDays(1);
      const stageBeforeCritical = new Stage('stage1').ofDuration(
        stage1Duration,
      );
      const criticalStage = new Stage('stage2').ofDuration(
        criticalStageDuration,
      );
      const stageAfterCritical = new Stage('stage3').ofDuration(
        Duration.ofDays(3),
      );
      await projectFacade.defineProjectStages(
        projectId,
        stageBeforeCritical,
        criticalStage,
        stageAfterCritical,
      );

      //and
      const criticalResourceName = ResourceId.newOne();
      const criticalCapabilityAvailability =
        resourceAvailableForCapabilityInPeriod(
          criticalResourceName,
          Capability.skill('JAVA'),
          JAN_1_6,
        );

      //when
      await projectFacade.planCriticalStageWithResource(
        projectId,
        criticalStage,
        criticalResourceName,
        JAN_4_8,
      );

      //then
      await verifyResourcesNotAvailable(
        projectId,
        criticalCapabilityAvailability,
        JAN_4_8,
      );

      //when
      await projectFacade.planCriticalStageWithResource(
        projectId,
        criticalStage,
        criticalResourceName,
        JAN_1_6,
      );

      //then
      await assertResourcesAvailable(projectId, criticalCapabilityAvailability);
      //and
      const project = await projectFacade.load(projectId);
      const schedule = project.schedule;

      assertThat(schedule)
        .hasStage('stage1')
        .withSlot(JAN_1_2)
        .and()
        .hasStage('stage2')
        .withSlot(JAN_1_6)
        .and()
        .hasStage('stage3')
        .withSlot(JAN_1_4);
    },
  );

  const assertResourcesAvailable = (
    projectId: ProjectId,
    resource: ResourceId,
  ): Promise<void> => {
    return Promise.resolve();
  };

  const verifyResourcesNotAvailable = (
    projectId: ProjectId,
    resource: ResourceId,
    requestedButNotAvailable: TimeSlot,
  ): Promise<void> => {
    return Promise.resolve();
  };

  const resourceAvailableForCapabilityInPeriod = (
    resource: ResourceId,
    capability: Capability,
    slot: TimeSlot,
  ): ResourceId => {
    return null!;
  };
});
