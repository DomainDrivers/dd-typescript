import {
  Cost,
  Earnings,
  Income,
  ProjectAllocationsId,
  type EarningsRecalculated,
} from '#allocation';
import { Clock } from '#utils';
import { UTCDate } from '@date-fns/utc';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { TestConfiguration } from '../../setup';
import { CashFlowTestConfiguration } from './cashFlowTestConfiguration';

void describe('CapabilityAllocating', () => {
  const NOW = new UTCDate();
  const testEnvironment = TestConfiguration();
  const cashFlowFacade = CashFlowTestConfiguration.cashFlowFacade(
    testEnvironment.eventBus,
    Clock.fixed(NOW),
  );

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
