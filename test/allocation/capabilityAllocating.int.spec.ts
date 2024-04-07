/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  AllocatableCapabilityId,
  AllocatableResourceId,
  AllocatedCapability,
  AllocationConfiguration,
  AllocationFacade,
  CapabilityPlanningConfiguration,
  CapabilityScheduler,
  CapabilitySelector,
  Demand,
  Demands,
  ProjectAllocationsId,
  toAvailabilityResourceId,
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
import {
  assertEquals,
  assertIsNotNull,
  assertIsNull,
  assertThatArray,
  assertTrue,
} from '../asserts';
import { TestConfiguration } from '../setup';

describe('CapabilityAllocating', () => {
  const testEnvironment = TestConfiguration();
  let allocationFacade: AllocationFacade;
  let availabilityFacade: AvailabilityFacade;
  let capabilityScheduler: CapabilityScheduler;

  const RESOURCE_ID = AllocatableResourceId.newOne();

  before(async () => {
    const connectionString = await testEnvironment.start({ schema });

    const configuration = new AllocationConfiguration(connectionString);

    allocationFacade = configuration.allocationFacade();
    availabilityFacade = new AvailabilityConfiguration(
      connectionString,
    ).availabilityFacade();
    capabilityScheduler = new CapabilityPlanningConfiguration(
      connectionString,
    ).capabilityScheduler();
  });

  after(async () => await testEnvironment.stop());

  it('can allocate capability to project', async () => {
    //given
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const skillJava = Capability.skill('JAVA');
    const demand = new Demand(skillJava, oneDay);
    //and
    const allocatableCapabilityId = await createAllocatableResource(
      oneDay,
      skillJava,
      RESOURCE_ID,
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
      allocatableCapabilityId,
      skillJava,
      oneDay,
    );

    //then
    assertIsNotNull(result);
    const summary = await allocationFacade.findAllProjectsAllocations();
    assertThatArray(
      summary.projectAllocations.get(projectId)!.all,
    ).containsExactly(
      new AllocatedCapability(allocatableCapabilityId, skillJava, oneDay),
    );
    assertThatArray(summary.demands.get(projectId)!.all).containsExactly(
      demand,
    );
    assertTrue(
      await availabilityWasBlocked(
        toAvailabilityResourceId(allocatableCapabilityId),
        oneDay,
        projectId,
      ),
    );
  });

  it('Cant allocate when resource not available', async () => {
    //given
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const skillJava = Capability.skill('JAVA');
    const demand = new Demand(skillJava, oneDay);
    //and
    const allocatableCapabilityId = await createAllocatableResource(
      oneDay,
      skillJava,
      RESOURCE_ID,
    );
    //and
    await availabilityFacade.block(
      toAvailabilityResourceId(allocatableCapabilityId),
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
      allocatableCapabilityId,
      skillJava,
      oneDay,
    );

    //then
    assertIsNull(result);
    const summary = await allocationFacade.findAllProjectsAllocations();
    assertThatArray(summary.projectAllocations.get(projectId)!.all).isEmpty();
  });

  it('can release capability from project', async () => {
    //given
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    //and
    const allocatableCapabilityId = await createAllocatableResource(
      oneDay,
      Capability.skill('JAVA'),
      RESOURCE_ID,
    );
    //and
    const projectId = ProjectAllocationsId.newOne();
    //and
    await allocationFacade.scheduleProjectAllocationDemands(
      projectId,
      Demands.none(),
    );
    //and
    const chosenCapability = Capability.skill('JAVA');
    await allocationFacade.allocateToProject(
      projectId,
      allocatableCapabilityId,
      chosenCapability,
      oneDay,
    );

    //when
    const result = await allocationFacade.releaseFromProject(
      projectId,
      allocatableCapabilityId,
      oneDay,
    );

    //then
    assert.ok(result);
    const summary = await allocationFacade.findAllProjectsAllocations();
    assert.equal(summary.projectAllocations.get(projectId)?.all.length, 0);
  });

  const createAllocatableResource = async (
    period: TimeSlot,
    capability: Capability,
    resourceId: AllocatableResourceId,
  ): Promise<AllocatableCapabilityId> => {
    const capabilities = [CapabilitySelector.canJustPerform(capability)];
    const allocatableCapabilityIds =
      await capabilityScheduler.scheduleResourceCapabilitiesForPeriod(
        resourceId,
        capabilities,
        period,
      );
    assertEquals(allocatableCapabilityIds.length, 1);
    return allocatableCapabilityIds[0];
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
