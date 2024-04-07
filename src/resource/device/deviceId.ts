import { AllocatableResourceId } from '#allocation';
import { UUID } from '#utils';

export type DeviceId = UUID<'DeviceId'>;

export const DeviceId = {
  newOne: (): DeviceId => UUID.randomUUID() as DeviceId,

  from: (key: UUID): DeviceId => key as DeviceId,

  toAllocatableResourceId: (deviceId: DeviceId) =>
    AllocatableResourceId.from(deviceId),
};
