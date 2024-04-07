import { TimeSlot } from '#shared';
import { UUID } from '#utils';
import { AllocatableResourceId, CapabilityScheduler } from '..';
import { TranslateToCapabilitySelector } from './translateToCapabilitySelector';

export class EmployeeCreatedInLegacySystemMessageHandler {
  constructor(private readonly capabilityScheduler: CapabilityScheduler) {}

  //subscribe to message bus
  //StreamListener to (message_bus)
  public handle = async (
    message: EmployeeDataFromLegacyEsbMessage,
  ): Promise<void> => {
    const allocatableResourceId = AllocatableResourceId.from(
      message.resourceId,
    );
    const capabilitySelectors =
      TranslateToCapabilitySelector.translate(message);
    await this.capabilityScheduler.scheduleResourceCapabilitiesForPeriod(
      allocatableResourceId,
      capabilitySelectors,
      message.timeSlot,
    );
  };
}
export class EmployeeDataFromLegacyEsbMessage {
  constructor(
    public readonly resourceId: UUID,
    public readonly skillsPerformedTogether: Array<string[]>,
    public readonly exclusiveSkills: string[],
    public readonly permissions: string[],
    public readonly timeSlot: TimeSlot,
  ) {}
}
