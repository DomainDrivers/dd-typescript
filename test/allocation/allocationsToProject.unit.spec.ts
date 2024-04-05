/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  AllocatedCapability,
  Allocations,
  CapabilitiesAllocated,
  CapabilityReleased,
  Demand,
  Demands,
  ProjectAllocations,
  ProjectAllocationsId,
  ResourceId,
} from '#allocation';
import { Capability, TimeSlot } from '#shared';
import { UUID, deepEquals } from '#utils';
import { UTCDate } from '@date-fns/utc';
import { addHours } from 'date-fns';
import assert from 'node:assert';
import { describe, it } from 'node:test';
const permission = Capability.permission;

describe('AllocationsToProject', () => {
  const WHEN = new UTCDate();
  const PROJECT_ID = ProjectAllocationsId.newOne();
  const ADMIN_ID = ResourceId.newOne();
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
    assert.ok(event);
    const capabilitiesAllocated = event;
    assert.ok(
      deepEquals(
        event,
        new CapabilitiesAllocated(
          capabilitiesAllocated.allocatedCapabilityId,
          PROJECT_ID,
          Demands.none(),
          WHEN,
          capabilitiesAllocated.eventId,
        ),
      ),
    );
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
    assert.ok(
      deepEquals(
        event,
        new CapabilitiesAllocated(
          capabilitiesAllocated.allocatedCapabilityId,
          PROJECT_ID,
          Demands.none(),
          WHEN,
          capabilitiesAllocated.eventId,
        ),
      ),
    );
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
    assert.ok(
      deepEquals(
        allocations.missingDemands(),
        Demands.of(new Demand(Capability.skill('JAVA'), FEB_1)),
      ),
    );

    assert.ok(event);
    const capabilitiesAllocated = event;
    assert.ok(
      deepEquals(
        event,
        new CapabilitiesAllocated(
          capabilitiesAllocated.allocatedCapabilityId,
          PROJECT_ID,
          Demands.of(new Demand(Capability.skill('JAVA'), FEB_1)),
          WHEN,
          capabilitiesAllocated.eventId,
        ),
      ),
    );
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
    //when
    assert.ok(allocatedAdmin);
    const event = allocations.release(
      allocatedAdmin.allocatedCapabilityId,
      FEB_1,
      WHEN,
    );

    //then
    assert.ok(event);
    assert.ok(
      deepEquals(
        event,
        new CapabilityReleased(PROJECT_ID, Demands.none(), WHEN, event.eventId),
      ),
    );
  });

  it('releasing has no effect when capability was not allocated', () => {
    //given
    const allocations = ProjectAllocations.empty(PROJECT_ID);

    //when
    const event = allocations.release(UUID.randomUUID(), FEB_1, WHEN);

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
    allocations.allocate(ADMIN_ID, Capability.skill('JAVA'), FEB_1, WHEN);
    //when
    assert.ok(allocatedAdmin);
    const event = allocations.release(
      allocatedAdmin.allocatedCapabilityId,
      FEB_1,
      WHEN,
    );

    //then
    assert.ok(event);
    assert.ok(
      deepEquals(
        event,
        new CapabilityReleased(
          PROJECT_ID,
          Demands.of(demandForAdmin),
          WHEN,
          event.eventId,
        ),
      ),
    );
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
      allocatedAdmin.allocatedCapabilityId,
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
      allocatedAdmin.allocatedCapabilityId,
      fifteenMinutesIn1Feb,
      WHEN,
    );

    //then
    assert.ok(event);
    assert.ok(
      deepEquals(
        event,
        new CapabilityReleased(PROJECT_ID, Demands.none(), WHEN, event.eventId),
      ),
    );
    assert.equal(allocations.allocations.all.length, 2);
    assert.ok(
      [
        new AllocatedCapability(ADMIN_ID, permission('ADMIN'), oneHourBefore),
        new AllocatedCapability(ADMIN_ID, permission('ADMIN'), theRest),
      ].filter((c) => allocations.allocations.all.some((a) => deepEquals(a, c)))
        .length === 2,
    );
  });
});
