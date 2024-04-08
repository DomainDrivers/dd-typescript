import type { EnlistableInTransaction, PostTransactionCommit } from '#storage';
import { ObjectMap } from '#utils';
import { type Event, type EventTypeOf } from './event';

export interface EventsPublisher {
  publish<EventType extends Event = Event>(event: EventType): Promise<void>;
}

export type EventHandler<E extends Event = Event> = (
  event: E,
) => Promise<void> | void;

export interface EventsSubscriber {
  subscribe<EventType extends Event>(
    eventTypes: EventTypeOf<EventType>[],
    eventHandler: EventHandler<EventType>,
  ): void;
}

export interface EventBus extends EventsPublisher, EventsSubscriber {}

export type TransactionAwareEventBus = EventBus &
  PostTransactionCommit &
  EnlistableInTransaction;

export const getTransactionAwareEventBus = (
  bus?: EventBus,
): TransactionAwareEventBus => {
  const eventBus = bus ?? getInMemoryEventsBus();

  let enlisted: boolean = false;

  let scheduled: Event[] = [];

  const commit = async () => {
    for (const event of scheduled) {
      await eventBus.publish(event);
    }
    scheduled = [];
  };

  return {
    publish: <EventType extends Event = Event>(
      event: EventType,
    ): Promise<void> => {
      if (enlisted) {
        scheduled = [...scheduled, event];
        return Promise.resolve();
      }

      return eventBus.publish(event);
    },

    subscribe: <EventType extends Event>(
      eventTypes: EventTypeOf<EventType>[],
      eventHandler: EventHandler<EventType>,
    ): void => eventBus?.subscribe(eventTypes, eventHandler),
    commit,
    enlist: (): void => {
      enlisted = true;
    },
  };
};

export const getInMemoryEventsBus = (): EventBus => {
  const allHandlers = ObjectMap.empty<string, EventHandler[]>();

  return {
    publish: async <EventType extends Event = Event>(
      event: EventType,
    ): Promise<void> => {
      const eventHandlers = allHandlers.getOrDefault(event.type, () => []);
      for (const handler of eventHandlers) {
        await handler(event);
      }
    },
    subscribe: <EventType extends Event>(
      eventTypes: EventTypeOf<EventType>[],
      eventHandler: EventHandler<EventType>,
    ): void => {
      for (const eventType of eventTypes) {
        allHandlers
          .getOrSet(eventType as unknown as string, () => [])
          .push(eventHandler as EventHandler);
      }
    },
  };
};
