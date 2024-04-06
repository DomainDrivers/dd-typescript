import type { Capability } from '#shared';
import type { ObjectSet } from '#utils';
import type { DeviceId } from './deviceId';

export class Device {
  #id: DeviceId;
  #model: string;
  #capabilities: ObjectSet<Capability>;
  #version: number;

  constructor(
    id: DeviceId,
    model: string,
    capabilities: ObjectSet<Capability>,
    version: number = 0,
  ) {
    this.#id = id;
    this.#model = model;
    this.#capabilities = capabilities;
    this.#version = version;
  }

  public get id() {
    return this.#id;
  }
  public get model() {
    return this.#model;
  }
  public get capabilities() {
    return this.#capabilities;
  }
  public get version() {
    return this.#version;
  }
}
