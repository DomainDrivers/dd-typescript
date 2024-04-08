/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { ResourceId } from '#availability';
import {
  Demand,
  Demands,
  DemandsPerStage,
  PlanningConfiguration,
  ProjectId,
  Stage,
  schema,
  type PlanningFacade,
} from '#planning';
import { Capability, TimeSlot } from '#shared';
import { Duration, ObjectMap } from '#utils';
import { UTCDate } from '@date-fns/utc';
import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { TestConfiguration } from '../setup';
import { ScheduleAssert } from './schedule/assertions';

const ofDays = Duration.ofDays;
const demandFor = Demand.demandFor;
const skill = Capability.skill;
const assertThat = ScheduleAssert.assertThat;

describe('Standard Waterfall', () => {
  const testEnvironment = TestConfiguration();
  let projectFacade: PlanningFacade;

  const JAN_1 = new UTCDate('2020-01-01T00:00:00.00Z');
  const RESOURCE_1 = ResourceId.newOne();
  const RESOURCE_2 = ResourceId.newOne();
  const RESOURCE_4 = ResourceId.newOne();
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

  before(async () => {
    const connectionString = await testEnvironment.start({ schema });

    const configuration = new PlanningConfiguration(connectionString);

    projectFacade = configuration.planningFacade();
  });

  after(testEnvironment.stop);

  it('waterfall project process', async () => {
    //given
    const projectId = await projectFacade.addNewProject('waterfall');

    //when
    await projectFacade.defineProjectStages(
      projectId,
      new Stage('stage1'),
      new Stage('stage2'),
      new Stage('stage3'),
    );

    //then
    let projectCard = await projectFacade.load(projectId);
    assert.equal(
      'stage1, stage2, stage3',
      projectCard.parallelizedStages.print(),
    );

    //when
    const demandsPerStage = new DemandsPerStage(
      ObjectMap.from([['stage1', Demands.of(demandFor(skill('java')))]]),
    );
    await projectFacade.defineDemandsPerStage(projectId, demandsPerStage);

    //then
    await verifyRiskDuringPlanning(projectId);

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
    projectCard = await projectFacade.load(projectId);
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
      //      .hasStage("stage1").withSlot(JAN_1_2)
      //     .and()
      .hasStage('stage2')
      .withSlot(JAN_2_5)
      .and()
      .hasStage('stage3')
      .withSlot(JAN_2_12);
  });

  const verifyRiskDuringPlanning = (projectId: ProjectId) => {
    return Promise.resolve();
  };
});
