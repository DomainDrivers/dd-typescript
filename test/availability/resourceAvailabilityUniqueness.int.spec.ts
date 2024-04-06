/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  ResourceAvailability,
  ResourceAvailabilityId,
  ResourceAvailabilityRepository,
} from '#availability';
import * as schema from '#schema';
import { TimeSlot } from '#shared';
import { getPool } from '#storage';
import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import pg from 'pg';
import { TestConfiguration } from '../setup';

describe('ResourceAvailabilityUniqueness', () => {
  const ONE_MONTH = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
  const testEnvironment = TestConfiguration();
  let client: pg.PoolClient;
  let resourceAvailabilityRepository: ResourceAvailabilityRepository;

  before(async () => {
    const connectionString = await testEnvironment.start({ schema });

    const pool = getPool(connectionString);
    client = await pool.connect();

    resourceAvailabilityRepository = new ResourceAvailabilityRepository(client);
  });

  after(async () => {
    try {
      client.release();
    } finally {
      await testEnvironment.stop();
    }
  });

  it('Cant save two availabilities with same resource id and segment', async () => {
    //given
    const resourceId = ResourceAvailabilityId.newOne();
    const anotherResourceId = ResourceAvailabilityId.newOne();
    const resourceAvailabilityId = ResourceAvailabilityId.newOne();

    //when
    await resourceAvailabilityRepository.saveNew(
      new ResourceAvailability(resourceAvailabilityId, resourceId, ONE_MONTH),
    );

    //expect
    try {
      await resourceAvailabilityRepository.saveNew(
        new ResourceAvailability(
          resourceAvailabilityId,
          anotherResourceId,
          ONE_MONTH,
        ),
      );
      assert.fail();
    } catch (error) {
      assert.ok(error);
    }
  });
});
