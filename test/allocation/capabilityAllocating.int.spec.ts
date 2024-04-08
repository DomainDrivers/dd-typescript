import {
  AllocatableCapabilityId,
  AllocatableResourceId,
  AllocationConfiguration,
  AllocationFacade,
  CapabilityPlanningConfiguration,
  CapabilityScheduler,
  CapabilitySelector,
  Demand,
  Demands,
  ProjectAllocationsId,
} from '#allocation';
import {
  AvailabilityConfiguration,
  AvailabilityFacade,
  Owner,
} from '#availability';
import * as schema from '#schema';
import { Capability, TimeSlot } from '#shared';
import { ObjectSet, deepEquals } from '#utils';
import { after, before, describe, it } from 'node:test';
import {
  assertEquals,
  assertFalse,
  assertThatArray,
  assertTrue,
} from '../asserts';
import { TestConfiguration } from '../setup';

const canPerformOneOf = CapabilitySelector.canPerformOneOf;
const skill = Capability.skill;
const skills = Capability.skills;

void describe('CapabilityAllocating', () => {
  const testEnvironment = TestConfiguration();
  let allocationFacade: AllocationFacade;
  let availabilityFacade: AvailabilityFacade;
  let capabilityScheduler: CapabilityScheduler;

  const ALLOCATABLE_RESOURCE_ID = AllocatableResourceId.newOne();
  const ALLOCATABLE_RESOURCE_ID_2 = AllocatableResourceId.newOne();
  const ALLOCATABLE_RESOURCE_ID_3 = AllocatableResourceId.newOne();

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

  void it('Can allocate any capability of required type', async () => {
    //given
    const javaAndPython = canPerformOneOf(skills('JAVA11', 'PYTHON'));
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    //and
    const allocatableCapabilityId1 = await scheduleCapabilities(
      ALLOCATABLE_RESOURCE_ID,
      javaAndPython,
      oneDay,
    );
    const allocatableCapabilityId2 = await scheduleCapabilities(
      ALLOCATABLE_RESOURCE_ID_2,
      javaAndPython,
      oneDay,
    );
    const allocatableCapabilityId3 = await scheduleCapabilities(
      ALLOCATABLE_RESOURCE_ID_3,
      javaAndPython,
      oneDay,
    );
    //and

    const projectId = ProjectAllocationsId.newOne();
    await allocationFacade.scheduleProjectAllocationDemands(
      projectId,
      Demands.none(),
    );

    //when
    const result = await allocationFacade.allocateCapabilityToProjectForPeriod(
      projectId,
      skill('JAVA11'),
      oneDay,
    );

    //then
    assertTrue(result);
    const allocatedCapabilities = await loadProjectAllocations(projectId);
    assertThatArray(allocatedCapabilities).containsAnyOf(
      allocatableCapabilityId1,
      allocatableCapabilityId2,
      allocatableCapabilityId3,
    );
    assertTrue(
      await availabilityWasBlocked(allocatedCapabilities, oneDay, projectId),
    );
  });

  void it(`Can't allocate any capability of required type when no capabilities`, async () => {
    //given
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    //and
    const projectId = ProjectAllocationsId.newOne();
    //and
    await allocationFacade.scheduleProjectAllocationDemands(
      projectId,
      Demands.none(),
    );

    //when
    const result = await allocationFacade.allocateCapabilityToProjectForPeriod(
      projectId,
      skill('DEBUGGING'),
      oneDay,
    );

    //then
    assertFalse(result);
    const summary = await allocationFacade.findAllProjectsAllocations();
    assertThatArray(summary.projectAllocations.get(projectId)!.all).isEmpty();
  });

  void it(`Can't allocate any capability of required type when all capabilities taken`, async () => {
    //given
    const capability = canPerformOneOf(skills('DEBUGGING'));
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);

    const allocatableCapabilityId1 = await scheduleCapabilities(
      ALLOCATABLE_RESOURCE_ID,
      capability,
      oneDay,
    );
    const allocatableCapabilityId2 = await scheduleCapabilities(
      ALLOCATABLE_RESOURCE_ID_2,
      capability,
      oneDay,
    );
    //and
    const project1 = await allocationFacade.createAllocation(
      oneDay,
      Demands.of(new Demand(skill('DEBUGGING'), oneDay)),
    );
    const project2 = await allocationFacade.createAllocation(
      oneDay,
      Demands.of(new Demand(skill('DEBUGGING'), oneDay)),
    );
    //and
    await allocationFacade.allocateToProject(
      project1,
      allocatableCapabilityId1,
      oneDay,
    );
    await allocationFacade.allocateToProject(
      project2,
      allocatableCapabilityId2,
      oneDay,
    );

    //and
    const projectId = ProjectAllocationsId.newOne();
    await allocationFacade.scheduleProjectAllocationDemands(
      projectId,
      Demands.none(),
    );

    //when
    const result = await allocationFacade.allocateCapabilityToProjectForPeriod(
      projectId,
      skill('DEBUGGING'),
      oneDay,
    );

    //then
    assertFalse(result);
    const summary = await allocationFacade.findAllProjectsAllocations();
    assertThatArray(summary.projectAllocations.get(projectId)!.all).isEmpty();
  });

  const loadProjectAllocations = async (
    projectId1: ProjectAllocationsId,
  ): Promise<ObjectSet<AllocatableCapabilityId>> => {
    const summary = await allocationFacade.findAllProjectsAllocations();
    const allocatedCapabilities = ObjectSet.from(
      summary.projectAllocations
        .get(projectId1)!
        .all.map((a) => a.allocatedCapabilityId),
    );
    return allocatedCapabilities;
  };

  const scheduleCapabilities = async (
    allocatableResourceId: AllocatableResourceId,
    capabilities: CapabilitySelector,
    oneDay: TimeSlot,
  ): Promise<AllocatableCapabilityId> => {
    const allocatableCapabilityIds =
      await capabilityScheduler.scheduleResourceCapabilitiesForPeriod(
        allocatableResourceId,
        [capabilities],
        oneDay,
      );
    assertEquals(allocatableCapabilityIds.length, 1);
    return allocatableCapabilityIds[0];
  };

  const availabilityWasBlocked = async (
    capabilities: AllocatableCapabilityId[],
    oneDay: TimeSlot,
    projectId: ProjectAllocationsId,
  ): Promise<boolean> => {
    const calendars = await availabilityFacade.loadCalendars(
      ObjectSet.from(
        capabilities.map(AllocatableCapabilityId.toAvailabilityResourceId),
      ),
      oneDay,
    );
    return calendars.calendars.every(({ value: calendar }) =>
      deepEquals(calendar.takenBy(Owner.of(projectId)), [oneDay]),
    );
  };
});
