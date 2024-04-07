import {
  CapabilitySelector,
  type AllocatableCapabilityId,
  type CapabilityScheduler,
} from '#allocation';
import type { TimeSlot } from '#shared';
import { DeviceId, type DeviceRepository } from '.';

const canPerformAllAtTheTime = CapabilitySelector.canPerformAllAtTheTime;

export class ScheduleDeviceCapabilities {
  constructor(
    private readonly deviceRepository: DeviceRepository,
    private readonly capabilityScheduler: CapabilityScheduler,
  ) {}

  public setupDeviceCapabilities = async (
    deviceId: DeviceId,
    timeSlot: TimeSlot,
  ): Promise<AllocatableCapabilityId[]> => {
    const summary = await this.deviceRepository.findSummary(deviceId);
    return this.capabilityScheduler.scheduleResourceCapabilitiesForPeriod(
      DeviceId.toAllocatableResourceId(deviceId),
      [canPerformAllAtTheTime(summary.assets)],
      timeSlot,
    );
  };
}
