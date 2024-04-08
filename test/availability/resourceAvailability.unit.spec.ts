import {
  Owner,
  ResourceAvailability,
  ResourceAvailabilityId,
  ResourceId,
} from '#availability';
import { TimeSlot } from '#shared';
import assert from 'node:assert';
import { describe, it } from 'node:test';

void describe('ResourceAvailability', () => {
  const resourceAvailability = ResourceAvailabilityId.newOne();
  const OWNER_ONE = Owner.newOne();
  const OWNER_TWO = Owner.newOne();

  const getResourceAvailability = () =>
    new ResourceAvailability(
      resourceAvailability,
      ResourceId.newOne(),
      TimeSlot.createDailyTimeSlotAtUTC(2000, 1, 1),
    );

  void it('can be blocked when is available', () => {
    //given
    const resourceAvailability = getResourceAvailability();

    //when
    const result = resourceAvailability.block(OWNER_ONE);

    //then
    assert.ok(result);
  });

  void it(`can't beBlocked when already blocked by someone else`, () => {
    //given
    const resourceAvailability = getResourceAvailability();
    //and
    resourceAvailability.block(OWNER_ONE);

    //when
    const result = resourceAvailability.block(OWNER_TWO);

    //then
    assert.equal(result, false);
  });

  void it('can be released only by initial owner', () => {
    //given
    const resourceAvailability = getResourceAvailability();
    //and
    resourceAvailability.block(OWNER_ONE);

    //when
    const result = resourceAvailability.release(OWNER_ONE);

    //then
    assert.ok(result);
  });

  void it(`can't be released by someone else`, () => {
    //given
    const resourceAvailability = getResourceAvailability();
    //and
    resourceAvailability.block(OWNER_ONE);

    //when
    const result = resourceAvailability.release(OWNER_TWO);

    //then
    assert.equal(result, false);
  });

  void it('can be blocked by someone else after releasing is available', () => {
    //given
    const resourceAvailability = getResourceAvailability();
    //and
    resourceAvailability.block(OWNER_ONE);
    //and
    resourceAvailability.release(OWNER_ONE);

    //when
    const result = resourceAvailability.release(OWNER_TWO);

    //then
    assert.ok(result);
  });

  void it('can disable when available', () => {
    //given
    const resourceAvailability = getResourceAvailability();

    //and
    const result = resourceAvailability.disable(OWNER_ONE);

    //then
    assert.ok(result);
    assert.ok(resourceAvailability.isDisabled());
    assert.ok(resourceAvailability.isDisabledBy(OWNER_ONE));
  });

  void it('can disable when blocked', () => {
    //given
    const resourceAvailability = getResourceAvailability();

    //and
    const resultBlocking = resourceAvailability.block(OWNER_ONE);

    //when
    const resultDisabling = resourceAvailability.disable(OWNER_TWO);

    //then
    assert.ok(resultBlocking);
    assert.ok(resultDisabling);
    assert.ok(resourceAvailability.isDisabled());
    assert.ok(resourceAvailability.isDisabledBy(OWNER_TWO));
  });

  void it('cant be blocked while disabled', () => {
    //given
    const resourceAvailability = getResourceAvailability();

    //and
    const resultDisabling = resourceAvailability.disable(OWNER_ONE);

    //when
    const resultBlocking = resourceAvailability.block(OWNER_TWO);
    const resultBlockingBySameOwner = resourceAvailability.block(OWNER_ONE);

    //then
    assert.ok(resultDisabling);
    assert.equal(resultBlocking, false);
    assert.equal(resultBlockingBySameOwner, false);
    assert.ok(resourceAvailability.isDisabled());
    assert.ok(resourceAvailability.isDisabledBy(OWNER_ONE));
  });

  void it('can be enabled by initial requester', () => {
    //given
    const resourceAvailability = getResourceAvailability();

    //and
    resourceAvailability.disable(OWNER_ONE);

    //and
    const result = resourceAvailability.enable(OWNER_ONE);

    //then
    assert.ok(result);
    assert.equal(resourceAvailability.isDisabled(), false);
    assert.equal(resourceAvailability.isDisabledBy(OWNER_ONE), false);
  });

  void it('cant be enabled by another requester', () => {
    //given
    const resourceAvailability = getResourceAvailability();

    //and
    resourceAvailability.disable(OWNER_ONE);

    //and
    const result = resourceAvailability.enable(OWNER_TWO);

    //then
    assert.equal(result, false);
    assert.ok(resourceAvailability.isDisabled());
    assert.ok(resourceAvailability.isDisabledBy(OWNER_ONE));
  });

  void it('can be blocked again after enabling', () => {
    //given
    const resourceAvailability = getResourceAvailability();

    //and
    resourceAvailability.disable(OWNER_ONE);

    //and
    resourceAvailability.enable(OWNER_ONE);

    //when
    const result = resourceAvailability.block(OWNER_TWO);

    //then
    assert.ok(result);
  });
});
