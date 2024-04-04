/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  Demand,
  Demands,
  ProjectId,
  Stage,
  type PlanningFacade,
} from '#planning';
import { Capability, ResourceName, TimeSlot } from '#shared';
import { Duration } from '#utils';
import { UTCDate } from '@date-fns/utc';
import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { ScheduleAssert } from './schedule/assertions';
import { PlannerTestEnvironment } from './setup';

const ofDays = Duration.ofDays;
const demandFor = Demand.demandFor;
const skill = Capability.skill;
const assertThat = ScheduleAssert.assertThat;

describe('Vision', () => {
  const testEnvironment = PlannerTestEnvironment();
  let projectFacade: PlanningFacade;

  const JAN_1 = new UTCDate('2020-01-01T00:00:00.00Z');
  const JAN_1_2 = new TimeSlot(
    new UTCDate('2020-01-01T00:00:00.00Z'),
    new UTCDate('2020-01-02T00:00:00.00Z'),
  );
  const JAN_2_5 = new TimeSlot(
    new UTCDate('2020-01-02T00:00:00.00Z'),
    new UTCDate('2020-01-05T00:00:00.00Z'),
  );
  const JAN_2_12 = new TimeSlot(
    new UTCDate('2020-01-02T00:00:00.00Z'),
    new UTCDate('2020-01-12T00:00:00.00Z'),
  );
  const RESOURCE_1 = new ResourceName('r1');
  const RESOURCE_2 = new ResourceName('r2');
  const RESOURCE_4 = new ResourceName('r4');

  before(async () => {
    const configuration = await testEnvironment.start();

    projectFacade = configuration.planningFacade();
  });

  after(testEnvironment.stop);

  it(
    'time critical waterfall project process',
    { skip: 'not implemented yet' },
    async () => {
      //given
      const projectId = await projectFacade.addNewProject('vision');
      //when
      const java = Demands.of(demandFor(skill('JAVA')));
      projectFacade.addDemands(projectId, java);

      //then
      await verifyPossibleRiskDuringPlanning(projectId, java);

      //when
      await projectFacade.defineProjectStages(
        projectId,
        new Stage('stage1').withChosenResourceCapabilities(RESOURCE_1),
        new Stage('stage2').withChosenResourceCapabilities(
          RESOURCE_2,
          RESOURCE_1,
        ),
        new Stage('stage3').withChosenResourceCapabilities(RESOURCE_4),
      );

      //then
      const projectCard = await projectFacade.load(projectId);
      assert.ok(
        ['stage1 | stage2, stage3', 'stage2, stage3 | stage1'].includes(
          projectCard.parallelizedStages.print(),
        ),
      );

      //when
      await projectFacade.defineProjectStages(
        projectId,
        new Stage('stage1')
          .ofDuration(ofDays(1))
          .withChosenResourceCapabilities(RESOURCE_1),
        new Stage('stage2')
          .ofDuration(ofDays(3))
          .withChosenResourceCapabilities(RESOURCE_2, RESOURCE_1),
        new Stage('stage3')
          .ofDuration(ofDays(10))
          .withChosenResourceCapabilities(RESOURCE_4),
      );
      //and
      await projectFacade.defineStartDate(projectId, JAN_1);

      //then
      const project = await projectFacade.load(projectId);
      const schedule = project.schedule;
      assertThat(schedule)
        .hasStage('stage1')
        .withSlot(JAN_1_2)
        .and()
        .hasStage('stage2')
        .withSlot(JAN_2_5)
        .and()
        .hasStage('stage3')
        .withSlot(JAN_2_12);
    },
  );

  const verifyPossibleRiskDuringPlanning = (
    projectId: ProjectId,
    demands: Demands,
  ) => {
    return Promise.resolve();
  };
});
