import {
  CashFlowFacade,
  Cashflow,
  ProjectAllocationsId,
  type CashflowRepository,
} from '#allocation';
import { InMemoryRepository, nulloTransactionContext } from '#storage';
import { Clock, type TransactionAwareEventPublisher } from '#utils';

export class CashFlowTestConfiguration {
  public static cashFlowFacade(
    eventsPublisher: TransactionAwareEventPublisher,
    clock: Clock,
  ): CashFlowFacade {
    return nulloTransactionContext(
      new CashFlowFacade(
        new InMemoryCashflowRepository(),
        eventsPublisher,
        clock,
      ),
      eventsPublisher.commit,
    );
  }
}

export class InMemoryCashflowRepository
  extends InMemoryRepository<Cashflow, ProjectAllocationsId>
  implements CashflowRepository
{
  constructor() {
    super((c) => c.projectId);
  }
}
