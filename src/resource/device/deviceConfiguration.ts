import {
  CapabilityPlanningConfiguration,
  CapabilityScheduler,
} from '#allocation';
import { getDB, injectDatabase } from '#storage';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { UtilsConfiguration } from '../../utils';
import * as schema from '../schema';
import { DeviceFacade } from './deviceFacade';
import {
  DrizzleDeviceRepository,
  type DeviceRepository,
} from './deviceRepository';
import { ScheduleDeviceCapabilities } from './scheduleDeviceCapabilities';

export class DeviceConfiguration {
  constructor(
    public readonly connectionString: string,
    public readonly utils: UtilsConfiguration,
    public readonly capabilityPlanningConfiguration: CapabilityPlanningConfiguration = new CapabilityPlanningConfiguration(
      connectionString,
    ),
  ) {}

  deviceFacade = (
    deviceRepository?: DeviceRepository,
    capabilityScheduler?: CapabilityScheduler,
  ): DeviceFacade => {
    deviceRepository = deviceRepository ?? this.deviceRepository();
    return injectDatabase(
      new DeviceFacade(
        deviceRepository,
        new ScheduleDeviceCapabilities(
          deviceRepository,
          capabilityScheduler ??
            this.capabilityPlanningConfiguration.capabilityScheduler(),
        ),
      ),
      this.db(),
      this.utils.eventBus.commit,
    );
  };

  public deviceRepository = (): DeviceRepository =>
    new DrizzleDeviceRepository();

  public db = (cs?: string): NodePgDatabase<typeof schema> =>
    getDB(cs ?? this.connectionString, { schema });
}
