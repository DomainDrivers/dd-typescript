import { Clock } from './clock';
import {
  getTransactionAwareEventBus,
  type TransactionAwareEventBus,
} from './eventsPublisher';

export class UtilsConfiguration {
  constructor(
    public readonly eventBus: TransactionAwareEventBus = getTransactionAwareEventBus(),
    public readonly clock: Clock = Clock,
  ) {}
}
