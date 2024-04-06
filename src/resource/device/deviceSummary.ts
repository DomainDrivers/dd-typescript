import type { Capability } from '../../shared';
import type { ObjectSet } from '../../utils';
import type { DeviceId } from './deviceId';

export class DeviceSummary {
  constructor(
    public readonly id: DeviceId,
    public readonly model: string,
    public readonly assets: ObjectSet<Capability>,
  ) {}
}
