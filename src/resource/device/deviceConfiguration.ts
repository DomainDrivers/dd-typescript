import {
  CapabilityPlanningConfiguration,
  CapabilityScheduler,
} from '#allocation';
import { getDB, injectDatabaseContext } from '#storage';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
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
    private readonly enableLogging: boolean = false,
  ) {
    console.log('connectionstring: ' + this.connectionString);
  }

  deviceFacade = (
    deviceRepository?: DeviceRepository,
    capabilityScheduler?: CapabilityScheduler,
  ): DeviceFacade => {
    deviceRepository = deviceRepository ?? this.deviceRepository();
    return injectDatabaseContext(
      new DeviceFacade(
        deviceRepository,
        new ScheduleDeviceCapabilities(
          deviceRepository,
          capabilityScheduler ??
            new CapabilityPlanningConfiguration(
              this.connectionString,
              this.enableLogging,
            ).capabilityScheduler(),
        ),
      ),
      this.db,
    );
  };

  public deviceRepository = (): DeviceRepository =>
    new DrizzleDeviceRepository();

  public db = (cs?: string): NodePgDatabase<typeof schema> =>
    getDB(cs ?? this.connectionString, { schema, logger: this.enableLogging });
}
