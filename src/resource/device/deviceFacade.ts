import type { Capability } from '#shared';
import { dbconnection, transactional } from '#storage';
import type { ObjectSet } from '#utils';
import { Device } from './device';
import { DeviceId } from './deviceId';
import type { DeviceRepository } from './deviceRepository';
import type { DeviceSummary } from './deviceSummary';

export class DeviceFacade {
  constructor(private readonly deviceRepository: DeviceRepository) {}

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
}
