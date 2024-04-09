import {
  Owner,
  ResourceAvailability,
  ResourceAvailabilityId,
  ResourceAvailabilityRepository,
  ResourceId,
} from '#availability';
import * as schema from '#schema';
import { TimeSlot } from '#shared';
import { getPool } from '#storage';
import { secondsToMilliseconds } from 'date-fns';
import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import pg from 'pg';
import { TestConfiguration } from '../setup';

void describe('ResourceAvailabilityOptimisticLocking', () => {
  const ONE_MONTH = TimeSlot.createDailyTimeSlotAtUTC(2021, 1, 1);
  const testEnvironment = TestConfiguration();
  let client: pg.PoolClient;
  let resourceAvailabilityRepository: ResourceAvailabilityRepository;

  before(async () => {
    const { connectionString } = await testEnvironment.start({ schema });

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

  void it('Update bumps version', async () => {
    //given
    const resourceAvailabilityId = ResourceAvailabilityId.newOne();
    const resourceId = ResourceId.newOne();
    let resourceAvailability = new ResourceAvailability(
      resourceAvailabilityId,
      resourceId,
      ONE_MONTH,
    );
    await resourceAvailabilityRepository.saveNew(resourceAvailability);

    //when
    resourceAvailability = await resourceAvailabilityRepository.loadById(
      resourceAvailabilityId,
    );
    resourceAvailability.block(Owner.newOne());
    await resourceAvailabilityRepository.saveCheckingVersion(
      resourceAvailability,
    );

    //then
    assert.equal(
      (await resourceAvailabilityRepository.loadById(resourceAvailabilityId))
        .version,
      1,
    );
  });

  void it(`can't update concurrently`, async () => {
    //given
    const resourceAvailabilityId = ResourceAvailabilityId.newOne();
    const resourceId = ResourceId.newOne();
    const resourceAvailability = new ResourceAvailability(
      resourceAvailabilityId,
      resourceId,
      ONE_MONTH,
    );
    await resourceAvailabilityRepository.saveNew(resourceAvailability);
    const results: boolean[] = [];
    //when

    const promises = new Array(10).fill(null).map(() =>
      wrapPromise(async () => {
        try {
          const loaded = await resourceAvailabilityRepository.loadById(
            resourceAvailabilityId,
          );
          loaded.block(Owner.newOne());
          results.push(
            await resourceAvailabilityRepository.saveCheckingVersion(loaded),
          );
        } catch (error) {
          console.error(error);
          // ignore
        }
      }, secondsToMilliseconds(10)).catch(),
    );

    await Promise.all(promises).catch();

    //then
    assert.ok(results.includes(false));
    assert.ok(
      (await resourceAvailabilityRepository.loadById(resourceAvailabilityId))
        .version < 10,
    );
  });
});

const awaitTimeout = (delay: number, reason: string) =>
  new Promise((resolve, reject) =>
    setTimeout(
      () => (reason === undefined ? resolve({}) : reject(reason)),
      delay,
    ),
  );

const wrapPromise = <T>(
  promise: () => Promise<T>,
  delay: number,
  reason: string = 'TIMEOUT!',
) => Promise.race([promise(), awaitTimeout(delay, reason)]);
