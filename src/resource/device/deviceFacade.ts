import type { AllocatableCapabilityId } from '#allocation';
import type { Capability, TimeSlot } from '#shared';
import { dbconnection, transactional } from '#storage';
import type { ObjectSet } from '#utils';
import { Device } from './device';
import { DeviceId } from './deviceId';
import type { DeviceRepository } from './deviceRepository';
import type { DeviceSummary } from './deviceSummary';
import type { ScheduleDeviceCapabilities } from './scheduleDeviceCapabilities';

export class DeviceFacade {
  constructor(
    private readonly deviceRepository: DeviceRepository,
    private readonly scheduleDeviceCapabilities: ScheduleDeviceCapabilities,
  ) {}

  @dbconnection
  public findDevice(deviceId: DeviceId): Promise<DeviceSummary> {
    return this.deviceRepository.findSummary(deviceId);
  }

  @dbconnection
  public findAllCapabilities(): Promise<Capability[]> {
    return this.deviceRepository.findAllCapabilities();
  }

  @transactional
  public async createDevice(
    model: string,
    assets: ObjectSet<Capability>,
  ): Promise<DeviceId> {
    const deviceId = DeviceId.newOne();
    const device = new Device(deviceId, model, assets);
    await this.deviceRepository.save(device);
    return deviceId;
  }

  @transactional
  public scheduleCapabilities(
    deviceId: DeviceId,
    oneDay: TimeSlot,
  ): Promise<AllocatableCapabilityId[]> {
    return this.scheduleDeviceCapabilities.setupDeviceCapabilities(
      deviceId,
      oneDay,
    );
  }
}
