/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  ChosenResources,
  Demand,
  Demands,
  DemandsPerStage,
  Schedule,
  Stage,
  type PlanningFacade,
} from '#planning';
import { Capability, ResourceName, TimeSlot } from '#shared';
import { Duration, ObjectMap, ObjectSet, deepEquals } from '#utils';
import { UTCDate } from '@date-fns/utc';
import assert from 'assert';
import { after, before, describe, it } from 'node:test';
import { PlannerTestEnvironment } from './setup';

const demandFor = Demand.demandFor;
const skill = Capability.skill;

describe('PlanningFacade', () => {
  const testEnvironment = PlannerTestEnvironment();
  let projectFacade: PlanningFacade;

  before(async () => {
    const configuration = await testEnvironment.start();

    projectFacade = configuration.planningFacade();
  });

  after(testEnvironment.stop);

  it('can create project and load project card', async () => {
    //given
    const projectId = await projectFacade.addNewProject(
      'project',
      new Stage('Stage1'),
    );

    //when
    const loaded = await projectFacade.load(projectId);

    //then
    assert.equal(loaded.projectId, projectId);
    assert.equal(loaded.name, 'project');
    assert.equal(loaded.parallelizedStages.print(), 'Stage1');
  });

  it('can load multiple projects', async () => {
    //given
    const projectId = await projectFacade.addNewProject(
      'project',
      new Stage('Stage1'),
    );
    const projectId2 = await projectFacade.addNewProject(
      'project2',
      new Stage('Stage2'),
    );

    //when
    const loaded = await projectFacade.loadAll(
      ObjectSet.from([projectId, projectId2]),
    );

    //then
    assert.deepEqual(
      loaded.map((p) => p.projectId),
      [projectId, projectId2],
    );
  });

  it('can create and save more complex parallelization', async () => {
    //given
    const stage1 = new Stage('Stage1');
    let stage2 = new Stage('Stage2');
    let stage3 = new Stage('Stage3');
    stage2 = stage2.dependsOn(stage1);
    stage3 = stage3.dependsOn(stage2);

    //and
    const projectId = await projectFacade.addNewProject(
      'project',
      stage1,
      stage2,
      stage3,
    );

    //when
    const loaded = await projectFacade.load(projectId);

    //then
    assert.equal(loaded.parallelizedStages.print(), 'Stage1 | Stage2 | Stage3');
  });

  it('can plan demands', async () => {
    // given;
    const projectId = await projectFacade.addNewProject(
      'project',
      new Stage('Stage1'),
    );

    // when;
    const demandForJava = Demands.of(demandFor(skill('JAVA')));
    await projectFacade.addDemands(projectId, demandForJava);

    // then;
    const loaded = await projectFacade.load(projectId);
    assert.ok(deepEquals(loaded.demands, demandForJava));
  });

  it('can plan new demands', async () => {
    //given
    const projectId = await projectFacade.addNewProject(
      'project',
      new Stage('Stage1'),
    );

    //when
    const java = demandFor(skill('JAVA'));
    const csharp = demandFor(skill('C#'));
    await projectFacade.addDemands(projectId, Demands.of(java));
    await projectFacade.addDemands(projectId, Demands.of(csharp));

    //then
    const loaded = await projectFacade.load(projectId);
    assert.ok(deepEquals(loaded.demands, Demands.of(java, csharp)));
  });

  it('can plan demands per stage', async () => {
    //given
    const projectId = await projectFacade.addNewProject(
      'project',
      new Stage('Stage1'),
    );

    //when
    const java = Demands.of(demandFor(skill('JAVA')));
    const demandsPerStage = new DemandsPerStage(
      ObjectMap.from([['Stage1', java]]),
    );
    await projectFacade.defineDemandsPerStage(projectId, demandsPerStage);

    //then
    const loaded = await projectFacade.load(projectId);
    assert.ok(deepEquals(loaded.demands, java));
    assert.ok(deepEquals(loaded.demandsPerStage, demandsPerStage));
  });

  it('can plan needed resources in time', async () => {
    //given
    const projectId = await projectFacade.addNewProject('project');

    //when
    const neededResources = ObjectSet.from([new ResourceName('resource1')]);
    const firstHalfOfTheYear = new TimeSlot(
      new UTCDate('2021-01-01T00:00:00.00Z'),
      new UTCDate('2021-06-01T00:00:00.00Z'),
    );
    await projectFacade.defineResourcesWithinDates(
      projectId,
      neededResources,
      firstHalfOfTheYear,
    );

    //then
    const loaded = await projectFacade.load(projectId);
    assert.ok(
      deepEquals(
        loaded.neededResources,
        new ChosenResources(neededResources, firstHalfOfTheYear),
      ),
    );
  });

  it('can redefine stages', async () => {
    //given
    const projectId = await projectFacade.addNewProject(
      'project',
      new Stage('Stage1'),
    );

    //when
    await projectFacade.defineProjectStages(projectId, new Stage('Stage2'));

    //then
    const loaded = await projectFacade.load(projectId);
    assert.equal(loaded.parallelizedStages.print(), 'Stage2');
  });

  it('can calculate schedule after passing possible start', async () => {
    //given
    const stage1 = new Stage('Stage1').ofDuration(Duration.ofDays(2));
    const stage2 = new Stage('Stage2').ofDuration(Duration.ofDays(5));
    const stage3 = new Stage('Stage3').ofDuration(Duration.ofDays(7));

    //and
    const projectId = await projectFacade.addNewProject(
      'project',
      stage1,
      stage2,
      stage3,
    );

    //when
    await projectFacade.defineStartDate(
      projectId,
      new UTCDate('2021-01-01T00:00:00.00Z'),
    );

    //then
    const expectedSchedule = ObjectMap.from([
      [
        'Stage1',
        new TimeSlot(
          new UTCDate('2021-01-01T00:00:00.00Z'),
          new UTCDate('2021-01-03T00:00:00.00Z'),
        ),
      ],
      [
        'Stage2',
        new TimeSlot(
          new UTCDate('2021-01-01T00:00:00.00Z'),
          new UTCDate('2021-01-06T00:00:00.00Z'),
        ),
      ],
      [
        'Stage3',
        new TimeSlot(
          new UTCDate('2021-01-01T00:00:00.00Z'),
          new UTCDate('2021-01-08T00:00:00.00Z'),
        ),
      ],
    ]);
    const loaded = await projectFacade.load(projectId);
    assert.ok(
      loaded.schedule.dates.filter((d) =>
        expectedSchedule.some((s) => deepEquals(s, d)),
      ).length === loaded.schedule.dates.length,
    );
  });

  it('can manually add schedule', async () => {
    //given
    const stage1 = new Stage('Stage1').ofDuration(Duration.ofDays(2));
    const stage2 = new Stage('Stage2').ofDuration(Duration.ofDays(5));
    const stage3 = new Stage('Stage3').ofDuration(Duration.ofDays(7));
    //and
    const projectId = await projectFacade.addNewProject(
      'project',
      stage1,
      stage2,
      stage3,
    );

    //when
    const dates = ObjectMap.from([
      [
        'Stage1',
        new TimeSlot(
          new UTCDate('2021-01-01T00:00:00.00Z'),
          new UTCDate('2021-01-03T00:00:00.00Z'),
        ),
      ],
      [
        'Stage2',
        new TimeSlot(
          new UTCDate('2021-01-03T00:00:00.00Z'),
          new UTCDate('2021-01-08T00:00:00.00Z'),
        ),
      ],
      [
        'Stage3',
        new TimeSlot(
          new UTCDate('2021-01-08T00:00:00.00Z'),
          new UTCDate('2021-01-15T00:00:00.00Z'),
        ),
      ],
    ]);
    await projectFacade.defineManualSchedule(projectId, new Schedule(dates));

    //then
    const loaded = await projectFacade.load(projectId);

    assert.ok(
      loaded.schedule.dates.filter((d) => dates.some((s) => deepEquals(s, d)))
        .length === loaded.schedule.dates.length,
    );
  });
});
