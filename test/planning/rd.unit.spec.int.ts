/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { ResourceId } from '#allocation';
import { AvailabilityFacade } from '#availability';
import {
  ParallelStagesList,
  ProjectCard,
  ProjectId,
  Stage,
  type PlanningFacade,
} from '#planning';
import { Capability, ResourceName, TimeSlot } from '#shared';
import { Duration, ObjectSet, deepEquals } from '#utils';
import { UTCDate } from '@date-fns/utc';
import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { ScheduleAssert } from './schedule/assertions';
import { PlannerTestEnvironment } from './setup';

const ofDays = Duration.ofDays;
const assertThat = ScheduleAssert.assertThat;

describe('RD', () => {
  const testEnvironment = PlannerTestEnvironment();
  let projectFacade: PlanningFacade;
  let availabilityFacade: AvailabilityFacade;

  const JANUARY = new TimeSlot(
    new UTCDate('2020-01-01T00:00:00.00Z'),
    new UTCDate('2020-01-31T00:00:00.00Z'),
  );
  const FEBRUARY = new TimeSlot(
    new UTCDate('2020-02-01T00:00:00.00Z'),
    new UTCDate('2020-02-28T00:00:00.00Z'),
  );
  const MARCH = new TimeSlot(
    new UTCDate('2020-03-01T00:00:00.00Z'),
    new UTCDate('2020-03-31T00:00:00.00Z'),
  );
  const Q1 = new TimeSlot(
    new UTCDate('2020-01-01T00:00:00.00Z'),
    new UTCDate('2020-03-31T00:00:00.00Z'),
  );
  const JAN_1_4 = new TimeSlot(
    new UTCDate('2020-01-01T00:00:00.00Z'),
    new UTCDate('2020-01-04T00:00:00.00Z'),
  );
  const FEB_2_16 = new TimeSlot(
    new UTCDate('2020-02-01T00:00:00.00Z'),
    new UTCDate('2020-02-16T00:00:00.00Z'),
  );
  const MAR_1_6 = new TimeSlot(
    new UTCDate('2020-03-01T00:00:00.00Z'),
    new UTCDate('2020-03-06T00:00:00.00Z'),
  );

  before(async () => {
    const configuration = await testEnvironment.start();

    projectFacade = configuration.planningFacade();
    availabilityFacade = new AvailabilityFacade();
  });

  after(testEnvironment.stop);

  it(
    'research and development project process',
    { skip: 'not implemented yet' },
    async () => {
      //given
      const projectId = await projectFacade.addNewProject('waterfall');
      //and

      const r1 = new ResourceName('r1');
      const javaAvailableInJanuary = resourceAvailableForCapabilityInPeriod(
        r1,
        Capability.skill('JAVA'),
        JANUARY,
      );
      const r2 = new ResourceName('r2');
      const phpAvailableInFebruary = resourceAvailableForCapabilityInPeriod(
        r2,
        Capability.skill('PHP'),
        FEBRUARY,
      );
      const r3 = new ResourceName('r3');
      const csharpAvailableInMarch = resourceAvailableForCapabilityInPeriod(
        r3,
        Capability.skill('CSHARP'),
        MARCH,
      );
      const allResources = ObjectSet.from([r1, r2, r3]);

      //when
      await projectFacade.defineResourcesWithinDates(
        projectId,
        allResources,
        JANUARY,
      );

      //then
      verifyThatResourcesAreMissing(
        projectId,
        ObjectSet.from(phpAvailableInFebruary, csharpAvailableInMarch),
      );

      //when
      await projectFacade.defineResourcesWithinDates(
        projectId,
        allResources,
        FEBRUARY,
      );

      //then
      verifyThatResourcesAreMissing(
        projectId,
        ObjectSet.from(javaAvailableInJanuary, csharpAvailableInMarch),
      );

      //when
      await projectFacade.defineResourcesWithinDates(
        projectId,
        allResources,
        Q1,
      );

      //then
      verifyThatNoResourcesAreMissing(projectId);

      //when
      await projectFacade.adjustStagesToResourceAvailability(
        projectId,
        Q1,
        new Stage('Stage1')
          .ofDuration(ofDays(3))
          .withChosenResourceCapabilities(r1),
        new Stage('Stage2')
          .ofDuration(ofDays(15))
          .withChosenResourceCapabilities(r2),
        new Stage('Stage3')
          .ofDuration(ofDays(5))
          .withChosenResourceCapabilities(r3),
      );

      //then
      const loaded = await projectFacade.load(projectId);
      const schedule = loaded.schedule;

      assertThat(schedule)
        .hasStage('Stage1')
        .withSlot(JAN_1_4)
        .and()
        .hasStage('Stage2')
        .withSlot(FEB_2_16)
        .and()
        .hasStage('Stage3')
        .withSlot(MAR_1_6);

      projectIsNotParallelized(loaded);
    },
  );

  const resourceAvailableForCapabilityInPeriod = (
    resource: ResourceName,
    capability: Capability,
    slot: TimeSlot,
  ): ResourceId => {
    //todo
    return ResourceId.newOne();
  };

  const projectIsNotParallelized = (loaded: ProjectCard): void => {
    assert.ok(
      deepEquals(loaded.parallelizedStages, ParallelStagesList.empty()),
    );
  };

  const verifyThatNoResourcesAreMissing = (
    projectId: ProjectId,
  ): Promise<void> => {
    //todo
    return Promise.resolve();
  };

  const verifyThatResourcesAreMissing = (
    projectId: ProjectId,
    missingResources: ObjectSet<ResourceId>,
  ): Promise<void> => {
    //todo
    return Promise.resolve();
  };
});
