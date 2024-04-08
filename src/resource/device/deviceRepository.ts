import { Capability } from '#shared';
import { DrizzleRepository, type Repository } from '#storage';
import { ObjectSet, UUID } from '#utils';
import { eq } from 'drizzle-orm';
import { Device, DeviceId } from '.';
import * as schema from '../schema';
import { DeviceSummary } from './deviceSummary';

export interface DeviceRepository extends Repository<Device, DeviceId> {
  findSummary(deviceId: DeviceId): Promise<DeviceSummary>;
  findAllCapabilities(): Promise<Capability[]>;
}

export class DrizzleDeviceRepository
  extends DrizzleRepository<Device, DeviceId, typeof schema>
  implements DeviceRepository
{
  constructor() {
    super(schema.devices, schema.devices.id, schema.devices.version);
  }

  public findById = async (id: DeviceId): Promise<Device | null> => {
    const result = await this.db.query.devices.findFirst({
      where: eq(schema.devices.id, id),
    });

    return result ? mapToDevice(result) : null;
  };

  public findSummary = async (deviceId: DeviceId): Promise<DeviceSummary> => {
    const device = await this.getById(deviceId);
    const assets = device.capabilities;
    return new DeviceSummary(deviceId, device.model, assets);
  };

  public findAllCapabilities = async (): Promise<Capability[]> => {
    const result = await this.db.select().from(schema.devices);

    return result.flatMap((d) => d.capabilities).map(mapToCapability);
  };

  public save = async (devices: Device): Promise<void> => {
    const entity = mapFromDevice(devices);
    const { id: _id, ...toUpdate } = entity;

    return this.upsert(entity, toUpdate, {
      id: devices.id,
    });
  };
}

const mapToDevice = (entity: schema.DeviceEntity): Device =>
  new Device(
    DeviceId.from(UUID.from(entity.id)),
    entity.model,
    ObjectSet.from(entity.capabilities.map(mapToCapability)),
    entity.version,
  );

const mapToCapability = ({ name, type }: schema.CapabilityEntity): Capability =>
  new Capability(name, type);

const mapFromDevice = (device: Device): schema.DeviceEntity => {
  return {
    id: device.id,
    model: device.model,
    capabilities: device.capabilities.map(mapFromCapability),
    version: device.version,
  };
};

const mapFromCapability = (capability: Capability): schema.CapabilityEntity => {
  return {
    name: capability.name,
    type: capability.type,
  };
};
