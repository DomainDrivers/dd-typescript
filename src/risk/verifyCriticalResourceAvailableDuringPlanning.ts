import type { AvailabilityFacade, Calendar } from '#availability';
import type { CriticalStagePlanned } from '#planning';
import type { RiskPushNotification } from '.';
import type { TimeSlot } from '../shared';

export class VerifyCriticalResourceAvailableDuringPlanning {
  constructor(
    private readonly availabilityFacade: AvailabilityFacade,
    private readonly riskPushNotification: RiskPushNotification,
  ) {}

  public async handle({
    data: criticalStagePlanned,
  }: CriticalStagePlanned): Promise<void> {
    if (criticalStagePlanned == null) {
      return;
    }
    const calendar = await this.availabilityFacade.loadCalendar(
      criticalStagePlanned.criticalResource,
      criticalStagePlanned.stageTimeSlot,
    );
    if (
      !this.resourceIsAvailable(criticalStagePlanned.stageTimeSlot, calendar)
    ) {
      await this.riskPushNotification.notifyAboutCriticalResourceNotAvailable(
        criticalStagePlanned.projectId,
        criticalStagePlanned.criticalResource,
        criticalStagePlanned.stageTimeSlot,
      );
    }
  }

  private resourceIsAvailable = (
    timeSlot: TimeSlot,
    calendar: Calendar,
  ): boolean => calendar.availableSlots().some((slot) => slot.equals(timeSlot));
}
