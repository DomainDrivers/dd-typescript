import {
  CashflowConfiguration,
  Cost,
  Earnings,
  Income,
  ProjectAllocationsId,
  type CashFlowFacade,
  type EarningsRecalculated,
} from '#allocation';
import * as schema from '#schema';
import assert from 'node:assert';
import { after, afterEach, before, describe, it } from 'node:test';
import { TestConfiguration } from '../../setup';

void describe('CapabilityAllocating', () => {
  const testEnvironment = TestConfiguration();
  let cashFlowFacade: CashFlowFacade;

  before(async () => {
    const connectionString = await testEnvironment.start({ schema });

    const configuration = new CashflowConfiguration(
      connectionString,
      testEnvironment.utilsConfiguration,
    );

    cashFlowFacade = configuration.cashflowFacade();
  });

  afterEach(testEnvironment.clearTestData);

  after(testEnvironment.stop);

  void it('can allocate capability to project', async () => {
    //given
    const projectId = ProjectAllocationsId.newOne();

    //when
    await cashFlowFacade.addIncomeAndCost(
      projectId,
      Income.of(100),
      Cost.of(50),
    );

    //then
    assert.ok(Earnings.of(50).isEqualTo(await cashFlowFacade.find(projectId)));
  });

  void it('Updating cash flow emits an event', async () => {
    //given
    const projectId = ProjectAllocationsId.newOne();
    const income = Income.of(100);
    const cost = Cost.of(50);

    //when
    await cashFlowFacade.addIncomeAndCost(projectId, income, cost);

    //then
    testEnvironment.eventBus.verifyPublishedEvent<EarningsRecalculated>(
      'EarningsRecalculated',
      { projectId, earnings: Earnings.of(50) },
    );
  });
});
