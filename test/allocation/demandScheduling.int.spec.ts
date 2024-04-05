/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  AllocationConfiguration,
  Demand,
  Demands,
  ProjectAllocationsId,
  type AllocationFacade,
} from '#allocation';
import * as schema from '#schema';
import { Capability, TimeSlot } from '#shared';
import { ObjectSet } from '#utils';
import { UTCDate } from '@date-fns/utc';
import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { TestConfiguration } from '../setup';

describe('DemandScheduling', () => {
  const JAVA = new Demand(
    Capability.skill('JAVA'),
    TimeSlot.createDailyTimeSlotAtUTC(2022, 2, 2),
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const PROJECT_DATES = new TimeSlot(
    new UTCDate('2021-01-01T00:00:00.00Z'),
    new UTCDate('2021-01-06T00:00:00.00Z'),
  );

  const testEnvironment = TestConfiguration();
  let allocationFacade: AllocationFacade;

  before(async () => {
    const connectionString = await testEnvironment.start({ schema });

    const configuration = new AllocationConfiguration(connectionString);

    allocationFacade = configuration.allocationFacade();
  });

  after(async () => await testEnvironment.stop());

  it('can create project and load project card', async () => {
    //given
    const projectId = ProjectAllocationsId.newOne();

    //when
    await allocationFacade.scheduleProjectAllocationDemands(
      projectId,
      Demands.of(JAVA),
    );

    //then
    const summary = await allocationFacade.findAllProjectsAllocations();
    assert.ok(summary.projectAllocations.has(projectId));
    assert.equal(summary.projectAllocations.get(projectId)!.all.length, 0);
    assert.equal(
      ObjectSet.from([
        ...summary.demands.get(projectId)!.all,
        ...Demands.of(JAVA).all,
      ]).length,
      summary.demands.get(projectId)!.all.length,
    );
  });
});
