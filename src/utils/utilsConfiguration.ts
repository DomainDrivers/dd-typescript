import { Clock } from './clock';
import { getInMemoryEventsBus, type EventBus } from './eventsPublisher';

export class UtilsConfiguration {
  constructor(
    public readonly eventBus: EventBus = getInMemoryEventsBus(),
    public readonly clock: Clock = Clock,
  ) {}
}
