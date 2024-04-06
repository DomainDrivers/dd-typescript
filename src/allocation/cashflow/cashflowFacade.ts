import { transactional } from '#storage';
import type { ProjectAllocationsId } from '..';
import { Cashflow } from './cashflow';
import type { CashflowRepository } from './cashflowRepository';
import type { Cost } from './cost';
import type { Earnings } from './earnings';
import type { Income } from './income';

export class CashflowFacade {
  constructor(private readonly repository: CashflowRepository) {}

  @transactional
  public async addIncomeAndCost(
    projectId: ProjectAllocationsId,
    income: Income,
    cost: Cost,
  ): Promise<void> {
    const cashflow =
      (await this.repository.findById(projectId)) ?? new Cashflow(projectId);
    cashflow.update(income, cost);
    await this.repository.save(cashflow);
  }

  public find = async (projectId: ProjectAllocationsId): Promise<Earnings> => {
    const byId = await this.repository.getById(projectId);
    return byId.earnings();
  };
}
