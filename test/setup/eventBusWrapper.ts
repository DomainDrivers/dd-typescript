import {
  deepEquals,
  isEventOfType,
  type Event,
  type EventDataOf,
  type EventHandler,
  type EventTypeOf,
  type OptionalEventMetaData,
  type TransactionAwareEventBus,
} from '#utils';
import { assertThatArray } from '../asserts';

export type EventBusWrapper = TransactionAwareEventBus & {
  verifyPublishedEvent: <EventType extends Event>(
    type: EventTypeOf<EventType>,
    data: Omit<EventDataOf<EventType>, 'eventId' | 'occurredAt'> &
      OptionalEventMetaData,
  ) => void;

  verifyPublishedEventThatMatches: <EventType extends Event>(
    type: EventTypeOf<EventType>,
    matches: (event: EventType) => boolean,
  ) => void;

  clearPublishedHistory: () => void;
};

export const wrapEventBusForTests = (
  eventBus: TransactionAwareEventBus,
): EventBusWrapper => {
  let publishedEvents: Event[] = [];

  return {
    publish: async <EventType extends Event = Event>(
      event: EventType,
    ): Promise<void> => {
      await eventBus.publish(event);
      publishedEvents.push(event);
    },
    enlist: (tx) => eventBus.enlist(tx),

    commit: () => eventBus.commit(),

    subscribe: <EventType extends Event>(
      eventTypes: EventTypeOf<EventType>[],
      eventHandler: EventHandler<EventType>,
    ): void => eventBus.subscribe(eventTypes, eventHandler),

    verifyPublishedEvent: <EventType extends Event>(
      type: EventTypeOf<EventType>,
      data: Omit<EventDataOf<EventType>, 'eventId' | 'occurredAt'> &
        OptionalEventMetaData,
    ): void =>
      assertThatArray(publishedEvents).anyMatches((published) => {
        const {
          eventId: expectedEventId,
          occurredAt: expectedOccurredAt,
          data: expectedData,
        } = data;
        const {
          eventId: actualEventId,
          occurredAt: actualOccurredAt,
          data: actualData,
        } = data;

        return (
          published.type === type &&
          deepEquals(expectedData, actualData) &&
          (expectedEventId
            ? expectedEventId === actualEventId
            : !actualEventId) &&
          (expectedOccurredAt
            ? expectedOccurredAt === actualOccurredAt
            : !actualOccurredAt)
        );
      }),

    verifyPublishedEventThatMatches: <EventType extends Event>(
      type: EventTypeOf<EventType>,
      matches: (event: EventType) => boolean,
    ) =>
      assertThatArray(publishedEvents).anyMatches(
        (published) =>
          isEventOfType<EventType>(type, published) && matches(published),
      ),

    clearPublishedHistory: () => (publishedEvents = []),
  };
};
