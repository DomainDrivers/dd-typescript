/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  CashflowConfiguration,
  Cost,
  Earnings,
  Income,
  ProjectAllocationsId,
  type CashflowFacade,
} from '#allocation';
import * as schema from '#schema';
import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { TestConfiguration } from '../../setup';

describe('CapabilityAllocating', () => {
  const testEnvironment = TestConfiguration();
  let cashflowFacade: CashflowFacade;

  before(async () => {
    const connectionString = await testEnvironment.start({ schema });

    const configuration = new CashflowConfiguration(connectionString);

    cashflowFacade = configuration.cashflowFacade();
  });

  after(testEnvironment.stop);

  it('can allocate capability to project', async () => {
    //given
    const projectId = ProjectAllocationsId.newOne();

    //when
    await cashflowFacade.addIncomeAndCost(
      projectId,
      Income.of(100),
      Cost.of(50),
    );

    //then
    assert.ok(Earnings.of(50).isEqualTo(await cashflowFacade.find(projectId)));
  });
});
