/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  AllocatableCapabilityId,
  AllocatedCapability,
  Allocations,
  Demand,
  Demands,
  ProjectAllocations,
  ProjectAllocationsId,
} from '#allocation';
import { Capability, TimeSlot } from '#shared';
import { UTCDate } from '@date-fns/utc';
import { addHours } from 'date-fns';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { assertEquals, assertThatArray } from '../asserts';
const permission = Capability.permission;

describe('AllocationsToProject', () => {
  const WHEN = new UTCDate();
  const PROJECT_ID = ProjectAllocationsId.newOne();
  const ADMIN_ID = AllocatableCapabilityId.newOne();
  const FEB_1 = TimeSlot.createDailyTimeSlotAtUTC(2020, 2, 1);
  const FEB_2 = TimeSlot.createDailyTimeSlotAtUTC(2020, 2, 2);
  const JANUARY = TimeSlot.createDailyTimeSlotAtUTC(2020, 1, 1);

  it('can allocate', () => {
    //given
    const allocations = ProjectAllocations.empty(PROJECT_ID);

    //when
    const event = allocations.allocate(
      ADMIN_ID,
      permission('ADMIN'),
      FEB_1,
      WHEN,
    );

    //then
    assert(event);
    const capabilitiesAllocated = event;
    assertEquals(event, {
      type: 'CapabilitiesAllocated',
      data: {
        allocatedCapabilityId: capabilitiesAllocated.data.allocatedCapabilityId,
        projectId: PROJECT_ID,
        missingDemands: Demands.none(),
        occurredAt: WHEN,
        eventId: capabilitiesAllocated.data.eventId,
      },
    });
  });

  it('cant allocate when requested time slot not within project slot', () => {
    //given
    const allocations = new ProjectAllocations(
      PROJECT_ID,
      Allocations.none(),
      Demands.none(),
      JANUARY,
    );

    //when
    const event = allocations.allocate(
      ADMIN_ID,
      permission('ADMIN'),
      FEB_1,
      WHEN,
    );

    //then
    assert.equal(event, null);
  });

  it('allocating has no effect when capability already allocated', () => {
    //given
    const allocations = ProjectAllocations.empty(PROJECT_ID);

    //and
    allocations.allocate(ADMIN_ID, permission('ADMIN'), FEB_1, WHEN);

    //when
    const event = allocations.allocate(
      ADMIN_ID,
      permission('ADMIN'),
      FEB_1,
      WHEN,
    );

    //then
    assert.equal(event, null);
  });

  it('there are no missing demands when all allocated', () => {
    //given
    const demands = Demands.of(
      new Demand(permission('ADMIN'), FEB_1),
      new Demand(Capability.skill('JAVA'), FEB_1),
    );
    //and
    const allocations = ProjectAllocations.withDemands(PROJECT_ID, demands);
    //and
    allocations.allocate(ADMIN_ID, permission('ADMIN'), FEB_1, WHEN);
    //when
    const event = allocations.allocate(
      ADMIN_ID,
      Capability.skill('JAVA'),
      FEB_1,
      WHEN,
    );
    //then
    assert.ok(event);
    const capabilitiesAllocated = event;
    assertEquals(event, {
      type: 'CapabilitiesAllocated',
      data: {
        allocatedCapabilityId: capabilitiesAllocated.data.allocatedCapabilityId,
        projectId: PROJECT_ID,
        missingDemands: Demands.none(),
        occurredAt: WHEN,
        eventId: capabilitiesAllocated.data.eventId,
      },
    });
  });

  it('missing demands are present when allocating for different than demanded slot', () => {
    //given
    const demands = Demands.of(
      new Demand(permission('ADMIN'), FEB_1),
      new Demand(Capability.skill('JAVA'), FEB_1),
    );
    //and
    const allocations = ProjectAllocations.withDemands(PROJECT_ID, demands);
    //and
    allocations.allocate(ADMIN_ID, permission('ADMIN'), FEB_1, WHEN);
    //when
    const event = allocations.allocate(
      ADMIN_ID,
      Capability.skill('JAVA'),
      FEB_2,
      WHEN,
    );
    //then
    assertEquals(
      allocations.missingDemands(),
      Demands.of(new Demand(Capability.skill('JAVA'), FEB_1)),
    );

    assert.ok(event);
    const capabilitiesAllocated = event;
    assertEquals(event, {
      type: 'CapabilitiesAllocated',
      data: {
        allocatedCapabilityId: capabilitiesAllocated.data.allocatedCapabilityId,
        projectId: PROJECT_ID,
        missingDemands: Demands.of(new Demand(Capability.skill('JAVA'), FEB_1)),
        occurredAt: WHEN,
        eventId: capabilitiesAllocated.data.eventId,
      },
    });
  });

  it('can release', () => {
    //given
    const allocations = ProjectAllocations.empty(PROJECT_ID);
    //and
    const allocatedAdmin = allocations.allocate(
      ADMIN_ID,
      permission('ADMIN'),
      FEB_1,
      WHEN,
    );
    const adminId = AllocatableCapabilityId.from(
      allocatedAdmin!.data.allocatedCapabilityId,
    );
    //when
    assert.ok(allocatedAdmin);
    const event = allocations.release(adminId, FEB_1, WHEN);

    //then
    assert.ok(event);
    assertEquals(event, {
      type: 'CapabilityReleased',
      data: {
        projectId: PROJECT_ID,
        missingDemands: Demands.none(),
        occurredAt: WHEN,
        eventId: event.data.eventId,
      },
    });
  });

  it('releasing has no effect when capability was not allocated', () => {
    //given
    const allocations = ProjectAllocations.empty(PROJECT_ID);

    //when
    const event = allocations.release(
      AllocatableCapabilityId.newOne(),
      FEB_1,
      WHEN,
    );

    //then
    assert.equal(event, null);
  });

  it('missing demands are present after releasing some of allocated capabilities', () => {
    //given
    const demandForJava = new Demand(Capability.skill('JAVA'), FEB_1);
    const demandForAdmin = new Demand(permission('ADMIN'), FEB_1);
    const allocations = ProjectAllocations.withDemands(
      PROJECT_ID,
      Demands.of(demandForAdmin, demandForJava),
    );
    //and
    const allocatedAdmin = allocations.allocate(
      ADMIN_ID,
      permission('ADMIN'),
      FEB_1,
      WHEN,
    );
    assert.ok(allocatedAdmin);
    allocations.allocate(
      AllocatableCapabilityId.newOne(),
      Capability.skill('JAVA'),
      FEB_1,
      WHEN,
    );
    //when
    assert.ok(allocatedAdmin);
    const event = allocations.release(
      AllocatableCapabilityId.from(allocatedAdmin.data.allocatedCapabilityId),
      FEB_1,
      WHEN,
    );

    //then
    assert.ok(event);
    assertEquals(event, {
      type: 'CapabilityReleased',
      data: {
        projectId: PROJECT_ID,
        missingDemands: Demands.of(demandForAdmin),
        occurredAt: WHEN,
        eventId: event.data.eventId,
      },
    });
  });

  it('releasing has no effect when releasing slot not within allocated slot', () => {
    //given
    const allocations = ProjectAllocations.empty(PROJECT_ID);
    //and
    const allocatedAdmin = allocations.allocate(
      ADMIN_ID,
      permission('ADMIN'),
      FEB_1,
      WHEN,
    );
    assert.ok(allocatedAdmin);

    //when
    const event = allocations.release(
      AllocatableCapabilityId.from(allocatedAdmin.data.allocatedCapabilityId),
      FEB_2,
      WHEN,
    );

    //then
    assert.equal(event, null);
  });

  it('releasing small part of slot leaves the rest', () => {
    //given
    const allocations = ProjectAllocations.empty(PROJECT_ID);
    //and
    const allocatedAdmin = allocations.allocate(
      ADMIN_ID,
      permission('ADMIN'),
      FEB_1,
      WHEN,
    );
    assert.ok(allocatedAdmin);

    //when
    const fifteenMinutesIn1Feb = new TimeSlot(
      addHours(FEB_1.from, 1),
      addHours(FEB_1.from, 2),
    );
    const oneHourBefore = new TimeSlot(FEB_1.from, addHours(FEB_1.from, 1));
    const theRest = new TimeSlot(addHours(FEB_1.from, 2), FEB_1.to);

    //when
    const event = allocations.release(
      AllocatableCapabilityId.from(allocatedAdmin.data.allocatedCapabilityId),
      fifteenMinutesIn1Feb,
      WHEN,
    );

    //then
    assert.ok(event);
    assertEquals(event, {
      type: 'CapabilityReleased',
      data: {
        projectId: PROJECT_ID,
        missingDemands: Demands.none(),
        occurredAt: WHEN,
        eventId: event.data.eventId,
      },
    });
    assert.equal(allocations.allocations.all.length, 2);
    assertThatArray(allocations.allocations.all).containsExactlyInAnyOrder(
      new AllocatedCapability(ADMIN_ID, permission('ADMIN'), oneHourBefore),
      new AllocatedCapability(ADMIN_ID, permission('ADMIN'), theRest),
    );
  });
});
