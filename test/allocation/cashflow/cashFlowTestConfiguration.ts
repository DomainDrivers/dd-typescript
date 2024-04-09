import {
  CashFlowFacade,
  Cashflow,
  ProjectAllocationsId,
  type CashflowRepository,
} from '#allocation';
import { InMemoryRepository } from '#storage';
import { Clock, type EventsPublisher } from '#utils';
import { mockTransactionContext } from '../../setup/mockTransactionContext';

export class CashFlowTestConfiguration {
  public static cashFlowFacade(
    eventsPublisher: EventsPublisher,
    clock: Clock,
  ): CashFlowFacade {
    return mockTransactionContext(
      new CashFlowFacade(
        new InMemoryCashflowRepository(),
        eventsPublisher,
        clock,
      ),
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
