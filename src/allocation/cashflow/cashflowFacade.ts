import { dbconnection, transactional } from '#storage';
import type { ProjectAllocationsId } from '..';
import { ObjectMap, UUID, type Clock, type EventsPublisher } from '../../utils';
import { Cashflow } from './cashflow';
import type { CashflowRepository } from './cashflowRepository';
import type { Cost } from './cost';
import type { Earnings } from './earnings';
import type { EarningsRecalculated } from './earningsRecalculated';
import type { Income } from './income';

export class CashFlowFacade {
  constructor(
    private readonly cashflowRepository: CashflowRepository,
    private readonly eventsPublisher: EventsPublisher,
    private readonly clock: Clock,
  ) {}

  @transactional
  public async addIncomeAndCost(
    projectId: ProjectAllocationsId,
    income: Income,
    cost: Cost,
  ): Promise<void> {
    const cashflow =
      (await this.cashflowRepository.findById(projectId)) ??
      new Cashflow(projectId);
    cashflow.update(income, cost);

    const event: EarningsRecalculated = {
      type: 'EarningsRecalculated',
      data: {
        projectId,
        earnings: cashflow.earnings(),
        occurredAt: this.clock.now(),
        eventId: UUID.randomUUID(),
      },
    };
    await this.eventsPublisher.publish(event);
    await this.cashflowRepository.save(cashflow);
  }

  @dbconnection
  public async find(projectId: ProjectAllocationsId): Promise<Earnings> {
    const byId = await this.cashflowRepository.getById(projectId);
    return byId.earnings();
  }

  @dbconnection
  public async findAllEarnings(): Promise<
    ObjectMap<ProjectAllocationsId, Earnings>
  > {
    return ObjectMap.from(
      (await this.cashflowRepository.findAll()).map((cashflow) => [
        cashflow.projectId,
        cashflow.earnings(),
      ]),
    );
  }
}
