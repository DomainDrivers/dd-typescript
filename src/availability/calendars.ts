import { ResourceName, TimeSlot } from '#shared';
import { ObjectMap } from '#utils';
import { Owner } from './owner';

//those classes will be part of another module - possibly "availability"
export class Calendars {
  constructor(private readonly calendars: ObjectMap<ResourceName, Calendar>) {}

  public static of = (...calendars: Calendar[]): Calendars => {
    const collect = ObjectMap.from(
      calendars.map((calendar) => {
        return [calendar.resourceId, calendar];
      }),
    );
    return new Calendars(collect);
  };

  get = (resourceId: ResourceName): Calendar =>
    this.calendars.getOrDefault(resourceId, Calendar.empty(resourceId));
}

export class Calendar {
  constructor(
    public readonly resourceId: ResourceName,
    public readonly calendar: ObjectMap<Owner, TimeSlot[]>,
  ) {}

  public static withAvailableSlots = (
    resourceId: ResourceName,
    ...availableSlots: TimeSlot[]
  ) =>
    new Calendar(resourceId, ObjectMap.from([[Owner.none(), availableSlots]]));

  public static empty = (resourceId: ResourceName) =>
    new Calendar(resourceId, ObjectMap.empty());

  availableSlots = (): TimeSlot[] =>
    this.calendar.getOrDefault(Owner.none(), []);
}
