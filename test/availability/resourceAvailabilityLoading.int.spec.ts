import {
  ResourceAvailability,
  ResourceAvailabilityId,
  ResourceAvailabilityRepository,
  ResourceId,
} from '#availability';
import * as schema from '#schema';
import { TimeSlot } from '#shared';
import { getPool } from '#storage';
import { deepEquals } from '#utils';
import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import pg from 'pg';
import { TestConfiguration } from '../setup';

void describe('ResourceAvailabilityLoading', () => {
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

  void it('Can save and load by id', async () => {
    //given
    const resourceAvailabilityId = ResourceAvailabilityId.newOne();
    const resourceId = ResourceId.newOne();
    const resourceAvailability = new ResourceAvailability(
      resourceAvailabilityId,
      resourceId,
      ONE_MONTH,
    );

    //when
    await resourceAvailabilityRepository.saveNew(resourceAvailability);

    //then
    const loaded = await resourceAvailabilityRepository.loadById(
      resourceAvailability.id,
    );
    assert.ok(deepEquals(resourceAvailability, loaded));
    assert.ok(deepEquals(resourceAvailability.segment, loaded.segment));
    assert.ok(deepEquals(resourceAvailability.resourceId, loaded.resourceId));
    assert.ok(deepEquals(resourceAvailability.blockedBy(), loaded.blockedBy()));
  });
});
