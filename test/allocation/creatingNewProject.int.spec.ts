import {
  AllocationConfiguration,
  Demand,
  Demands,
  InMemoryProjectAllocationsRepository,
  type AllocationFacade,
} from '#allocation';
import * as schema from '#schema';
import { Capability, TimeSlot } from '#shared';
import { ObjectSet, deepEquals } from '#utils';
import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { TestConfiguration } from '../setup';

void describe('creatingNewProject', () => {
  const JAN = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
  const FEB = TimeSlot.createDailyTimeSlotAtUTC(2021, 2, 1);

  const testEnvironment = TestConfiguration();
  let allocationFacade: AllocationFacade;

  before(async () => {
    const { connectionString } = await testEnvironment.start({
      schema,
    });

    const configuration = new AllocationConfiguration(connectionString);

    allocationFacade = configuration.allocationFacade(
      new InMemoryProjectAllocationsRepository(),
    );
  });

  after(async () => await testEnvironment.stop());

  void it('can create new project', async () => {
    //given
    const demand = new Demand(Capability.skill('JAVA'), JAN);

    //when
    const demands = Demands.of(demand);
    const newProject = await allocationFacade.createAllocation(JAN, demands);

    //then
    const summary = await allocationFacade.findAllProjectsAllocations(
      ObjectSet.from([newProject]),
    );
    assert.ok(deepEquals(summary.demands.get(newProject), demands));
    assert.ok(deepEquals(summary.timeSlots.get(newProject), JAN));
  });

  void it('can redefine project deadline', async () => {
    //given
    const demand = new Demand(Capability.skill('JAVA'), JAN);
    //and
    const demands = Demands.of(demand);
    const newProject = await allocationFacade.createAllocation(JAN, demands);

    //when
    await allocationFacade.editProjectDates(newProject, FEB);

    //then
    const summary = await allocationFacade.findAllProjectsAllocations(
      ObjectSet.from([newProject]),
    );
    assert.ok(deepEquals(summary.timeSlots.get(newProject), FEB));
  });
});
