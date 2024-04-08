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
import { after, before, describe, it } from 'node:test';
import {
  assertEquals,
  assertIsNotNull,
  assertIsNull,
  assertThatArray,
  assertTrue,
} from '../asserts';
import { TestConfiguration } from '../setup';

const toAvailabilityResourceId =
  AllocatableCapabilityId.toAvailabilityResourceId;
const canJustPerform = CapabilitySelector.canJustPerform;

void describe('ResourceAllocating', () => {
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

  void it('Can allocate capability to project', async () => {
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
      oneDay,
    );

    //then
    assertIsNotNull(result);
    const summary = await allocationFacade.findAllProjectsAllocations();
    assertThatArray(
      summary.projectAllocations.get(projectId)!.all,
    ).containsExactly(
      new AllocatedCapability(
        allocatableCapabilityId,
        canJustPerform(skillJava),
        oneDay,
      ),
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

  void it(`Can't allocate when resource not available`, async () => {
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
      oneDay,
    );

    //then
    assertIsNull(result);
    const summary = await allocationFacade.findAllProjectsAllocations();
    assertThatArray(summary.projectAllocations.get(projectId)!.all).isEmpty();
  });

  void it(`Can't allocate when capability has not been scheduled`, async () => {
    //given
    const oneDay = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
    const skillJava = Capability.skill('JAVA');
    const demand = new Demand(skillJava, oneDay);
    //and
    const notScheduledCapability = AllocatableCapabilityId.newOne();
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
      notScheduledCapability,
      oneDay,
    );

    //then
    assertIsNull(result);
    const summary = await allocationFacade.findAllProjectsAllocations();
    assertThatArray(summary.projectAllocations.get(projectId)!.all).isEmpty();
  });

  void it('Can release capability from project', async () => {
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
    await allocationFacade.allocateToProject(
      projectId,
      allocatableCapabilityId,
      oneDay,
    );

    //when
    const result = await allocationFacade.releaseFromProject(
      projectId,
      allocatableCapabilityId,
      oneDay,
    );

    //then
    assertTrue(result);
    const summary = await allocationFacade.findAllProjectsAllocations();
    assertThatArray(summary.projectAllocations.get(projectId)!.all).isEmpty();
    assertTrue(
      await availabilityIsReleased(oneDay, allocatableCapabilityId, projectId),
    );
  });

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

  const createAllocatableResource = (
    period: TimeSlot,
    capability: Capability,
    resourceId: AllocatableResourceId,
  ): Promise<AllocatableCapabilityId> => {
    const capabilitySelector = canJustPerform(capability);
    return scheduleCapabilities(resourceId, capabilitySelector, period);
  };

  const availabilityWasBlocked = async (
    resource: ResourceId,
    oneDay: TimeSlot,
    projectId: ProjectAllocationsId,
  ): Promise<boolean> => {
    const calendars = await availabilityFacade.loadCalendars(
      ObjectSet.from([resource]),
      oneDay,
    );
    return calendars.calendars.every(({ value: calendar }) =>
      deepEquals(calendar.takenBy(Owner.of(projectId)), [oneDay]),
    );
  };

  const availabilityIsReleased = async (
    oneDay: TimeSlot,
    allocatableCapabilityId: AllocatableCapabilityId,
    projectId: ProjectAllocationsId,
  ): Promise<boolean> =>
    !(await availabilityWasBlocked(
      toAvailabilityResourceId(allocatableCapabilityId),
      oneDay,
      projectId,
    ));
});
