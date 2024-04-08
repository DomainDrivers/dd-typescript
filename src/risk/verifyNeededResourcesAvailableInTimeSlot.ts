import type { RiskPushNotification } from '.';
import { AvailabilityFacade, ResourceId } from '../availability';
import type { NeededResourcesChosen } from '../planning/neededResourcesChosen';
import { TimeSlot } from '../shared';
import { ProjectId } from '../simulation';
import { dbconnection } from '../storage';
import { ObjectSet } from '../utils';
export class VerifyNeededResourcesAvailableInTimeSlot {
  constructor(
    private readonly availabilityFacade: AvailabilityFacade,
    private readonly riskPushNotification: RiskPushNotification,
  ) {}

  @dbconnection
  public handle({
    data: resourcesNeeded,
  }: NeededResourcesChosen): Promise<void> {
    return this.notifyAboutNotAvailableResources(
      resourcesNeeded.neededResources,
      resourcesNeeded.timeSlot,
      resourcesNeeded.projectId,
    );
  }

  private notifyAboutNotAvailableResources = async (
    resourcedIds: ObjectSet<ResourceId>,
    timeSlot: TimeSlot,
    projectId: ProjectId,
  ) => {
    const notAvailable = ObjectSet.empty<ResourceId>();
    const calendars = await this.availabilityFacade.loadCalendars(
      resourcedIds,
      timeSlot,
    );
    for (const resourceId of resourcedIds) {
      if (
        calendars
          .get(resourceId)
          .availableSlots()
          .every((s) => !timeSlot.within(s))
      ) {
        notAvailable.push(resourceId);
      }
    }
    if (notAvailable.length > 0) {
      await this.riskPushNotification.notifyAboutResourcesNotAvailable(
        projectId,
        notAvailable,
      );
    }
  };
}
