/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  AllocatedCapability,
  AllocationConfiguration,
  Demand,
  Demands,
  ProjectAllocationsId,
  type AllocationFacade,
} from '#allocation';
import {
  AvailabilityConfiguration,
  AvailabilityFacade,
  Owner,
  ResourceId,
} from '#availability';
import * as schema from '#schema';
import { Capability, TimeSlot } from '#shared';
import { ObjectSet, deepEquals } from '#utils';
import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { assertThatArray } from '../asserts';
import { TestConfiguration } from '../setup';

describe('CapabilityAllocating', () => {
  const testEnvironment = TestConfiguration();
  let allocationFacade: AllocationFacade;
  let availabilityFacade: AvailabilityFacade;

  before(async () => {
    const connectionString = await testEnvironment.start({ schema });

    const configuration = new AllocationConfiguration(connectionString);

    allocationFacade = configuration.allocationFacade();
    availabilityFacade = new AvailabilityConfiguration(
      connectionString,
    ).availabilityFacade();
  });

  after(async () => await testEnvironment.stop());

  it('can allocate capability to project', async () => {
    //given
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const skillJava = Capability.skill('JAVA');
    const demand = new Demand(skillJava, oneDay);
    //and
    const allocatableResourceId = await createAllocatableResource(oneDay);
    //and

    const projectId = ProjectAllocationsId.newOne();
    //and
    await allocationFacade.scheduleProjectAllocationDemands(
      projectId,
      Demands.of(demand),
    );

    //when
    const result = await allocationFacade.allocateToProject(
      projectId,
      allocatableResourceId,
      skillJava,
      oneDay,
    );

    //then
    assert.ok(result);
    const summary = await allocationFacade.findAllProjectsAllocations();
    assert.equal(summary.projectAllocations.get(projectId)!.all.length, 1);
    assert.ok(
      deepEquals(
        summary.projectAllocations.get(projectId)!.all[0],
        new AllocatedCapability(allocatableResourceId, skillJava, oneDay),
      ),
    );
    assert.equal(summary.demands.get(projectId)!.all.length, 1);
    assert.ok(deepEquals(demand, summary.demands.get(projectId)!.all[0]));
    assert.ok(
      await availabilityWasBlocked(allocatableResourceId, oneDay, projectId),
    );
  });

  it('Cant allocate when resource not available', async () => {
    //given
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const skillJava = Capability.skill('JAVA');
    const demand = new Demand(skillJava, oneDay);
    //and
    const allocatableResourceId = await createAllocatableResource(oneDay);
    //and
    await availabilityFacade.block(
      allocatableResourceId,
      oneDay,
      Owner.newOne(),
    );
    //and
    const projectId = ProjectAllocationsId.newOne();
    //and
    await allocationFacade.scheduleProjectAllocationDemands(
      projectId,
      Demands.of(demand),
    );

    //when
    const result = await allocationFacade.allocateToProject(
      projectId,
      allocatableResourceId,
      skillJava,
      oneDay,
    );

    //then
    assert.equal(result, null);
    const summary = await allocationFacade.findAllProjectsAllocations();
    assertThatArray(summary.projectAllocations.get(projectId)!.all).isEmpty();
  });

  it('can release capability from project', async () => {
    //given
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    //and
    const allocatableResourceId = await createAllocatableResource(oneDay);
    //and
    const projectId = ProjectAllocationsId.newOne();
    //and
    await allocationFacade.scheduleProjectAllocationDemands(
      projectId,
      Demands.none(),
    );
    //and
    const chosenCapability = Capability.skill('JAVA');
    const allocatedId = await allocationFacade.allocateToProject(
      projectId,
      allocatableResourceId,
      chosenCapability,
      oneDay,
    );

    //when
    const result = await allocationFacade.releaseFromProject(
      projectId,
      allocatedId!,
      oneDay,
    );

    //then
    assert.ok(result);
    const summary = await allocationFacade.findAllProjectsAllocations();
    assert.equal(summary.projectAllocations.get(projectId)?.all.length, 0);
  });

  const createAllocatableResource = async (
    period: TimeSlot,
  ): Promise<ResourceId> => {
    const resourceId = ResourceId.newOne();
    await availabilityFacade.createResourceSlots(resourceId, period);
    return resourceId;
  };

  const availabilityWasBlocked = async (
    resource: ResourceId,
    period: TimeSlot,
    projectId: ProjectAllocationsId,
  ): Promise<boolean> => {
    const calendars = await availabilityFacade.loadCalendars(
      ObjectSet.from([resource]),
      period,
    );
    return calendars.calendars.every(({ value: calendar }) =>
      deepEquals(calendar.takenBy(Owner.of(projectId)), [period]),
    );
  };
});
