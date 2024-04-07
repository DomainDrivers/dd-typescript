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
    eventHandler: EventHandler<EventType>,
    ...eventTypes: EventTypeOf<EventType>[]
  ): void;
}

export interface EventBus extends EventsPublisher, EventsSubscriber {}

export const getInMemoryEventsBus = (): EventsPublisher & EventsSubscriber => {
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
      eventHandler: EventHandler<EventType>,
      ...eventTypes: EventTypeOf<EventType>[]
    ): void => {
      for (const eventType of eventTypes) {
        allHandlers
          .getOrSet(eventType as unknown as string, () => [])
          .push(eventHandler as EventHandler);
      }
    },
  };
};
