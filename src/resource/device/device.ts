import type { Capability } from '#shared';
import type { ObjectSet } from '#utils';
import type { DeviceId } from './deviceId';

export class Device {
  private _id: DeviceId;
  private _model: string;
  private _capabilities: ObjectSet<Capability>;
  private _version: number;

  constructor(
    id: DeviceId,
    model: string,
    capabilities: ObjectSet<Capability>,
    version: number = 0,
  ) {
    this._id = id;
    this._model = model;
    this._capabilities = capabilities;
    this._version = version;
  }

  public get id() {
    return this._id;
  }
  public get model() {
    return this._model;
  }
  public get capabilities() {
    return this._capabilities;
  }
  public get version() {
    return this._version;
  }
}
