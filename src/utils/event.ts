import { Clock, UUID, type Flavour } from '#utils';
import { UTCDate } from '@date-fns/utc';

export type EventMetaData = Readonly<{ eventId: UUID; occurredAt: UTCDate }>;
export type OptionalEventMetaData = Readonly<{
  eventId?: UUID;
  occurredAt?: UTCDate;
}>;

export type EventTypeOf<T extends Event> = T['type'];
export type EventDataOf<T extends Event> = T['data'];

export type Event<
  EventType extends string = string,
  EventData extends Record<string, unknown> = Record<string, unknown>,
> = Flavour<
  Readonly<{
    type: EventType;
    data: Readonly<EventData> & EventMetaData;
  }>,
  'Event'
>;

export type PrivateEvent<
  EventType extends string = string,
  EventData extends Record<string, unknown> = Record<string, unknown>,
> = Event<EventType, EventData> & { readonly _private?: true };

export type PublishedEvent<
  EventType extends string = string,
  EventData extends Record<string, unknown> = Record<string, unknown>,
> = Event<EventType, EventData> & { readonly _public?: true };

export type PrivateAndPublishedEvent<
  EventType extends string = string,
  EventData extends Record<string, unknown> = Record<string, unknown>,
> = Event<EventType, EventData> & {
  readonly _private?: true;
  readonly _public?: true;
};

export const event = <EventType extends PrivateEvent | PublishedEvent>(
  type: EventTypeOf<EventType>,
  data: Omit<EventDataOf<EventType>, 'eventId' | 'occurredAt'> &
    OptionalEventMetaData,
  clock: Clock = Clock,
): EventType => {
  return {
    type,
    data: {
      eventId: UUID.randomUUID(),
      occurredAt: clock.now(),
      ...data,
    },
  } as EventType;
};

export const isEventOfType = <EventType extends Event>(
  expectedType: EventTypeOf<EventType>,
  event: Event,
): event is EventType => event.type === expectedType;
