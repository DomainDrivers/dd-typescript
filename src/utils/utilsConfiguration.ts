import { Clock } from './clock';
import { getInMemoryEventsBus, type EventsPublisher } from './eventsPublisher';

export class UtilsConfiguration {
  constructor(
    public readonly eventsPublisher: EventsPublisher = getInMemoryEventsBus(),
    public readonly clock: Clock = Clock,
  ) {}
}
