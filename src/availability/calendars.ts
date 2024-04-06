import { TimeSlot } from '#shared';
import { ObjectMap } from '#utils';
import { Owner } from './owner';
import type { ResourceId } from './resourceId';

//those classes will be part of another module - possibly "availability"
export class Calendars {
  constructor(public readonly calendars: ObjectMap<ResourceId, Calendar>) {}

  public static of = (...calendars: Calendar[]): Calendars => {
    const collect = ObjectMap.from(
      calendars.map((calendar) => {
        return [calendar.resourceId, calendar];
      }),
    );
    return new Calendars(collect);
  };

  get = (resourceId: ResourceId): Calendar =>
    this.calendars.getOrDefault(resourceId, () => Calendar.empty(resourceId));
}

export class Calendar {
  constructor(
    public readonly resourceId: ResourceId,
    public readonly calendar: ObjectMap<Owner, TimeSlot[]>,
  ) {}

  public static withAvailableSlots = (
    resourceId: ResourceId,
    ...availableSlots: TimeSlot[]
  ) =>
    new Calendar(resourceId, ObjectMap.from([[Owner.none(), availableSlots]]));

  public static empty = (resourceId: ResourceId) =>
    new Calendar(resourceId, ObjectMap.empty());

  public availableSlots = (): TimeSlot[] =>
    this.calendar.getOrDefault(Owner.none(), () => []);

  public takenBy = (requester: Owner): TimeSlot[] =>
    this.calendar.getOrDefault(requester, () => []);
}
