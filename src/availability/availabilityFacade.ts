import { Calendars } from './calendars';

export class AvailabilityFacade {
  public availabilitiesOfResources = (): Calendars => Calendars.of();
}
