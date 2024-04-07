import { UUID, type Flavour } from '#utils';
import { UTCDate } from '@date-fns/utc';

export type EventMetaData = Readonly<{ eventId: UUID; occurredAt: UTCDate }>;

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

export const event = <EventType extends Event>(
  type: EventTypeOf<EventType>,
  data: EventDataOf<EventType>,
): EventType => {
  return { type, data } as EventType;
};
