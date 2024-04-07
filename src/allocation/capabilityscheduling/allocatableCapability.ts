import type { Capability, TimeSlot } from '#shared';
import type { ObjectSet } from '#utils';
import { AllocatableCapabilityId } from './allocatableCapabilityId';
import type { AllocatableResourceId } from './allocatableResourceId';
import type { CapabilitySelector } from './capabilitySelector';

export class AllocatableCapability {
  #id: AllocatableCapabilityId;
  #resourceId: AllocatableResourceId;
  #possibleCapabilities: CapabilitySelector;
  #timeSlot: TimeSlot;

  constructor(
    resourceId: AllocatableResourceId,
    possibleCapabilities: CapabilitySelector,
    timeSlot: TimeSlot,
    id: AllocatableCapabilityId = AllocatableCapabilityId.newOne(),
  ) {
    this.#id = id;
    this.#resourceId = resourceId;
    this.#possibleCapabilities = possibleCapabilities;
    this.#timeSlot = timeSlot;
  }

  public canPerform = (capabilities: ObjectSet<Capability>): boolean =>
    this.#possibleCapabilities.canPerform(...capabilities);

  public get id() {
    return this.#id;
  }
  public get resourceId() {
    return this.#resourceId;
  }

  public get slot() {
    return this.#timeSlot;
  }

  public get capabilities() {
    return this.#possibleCapabilities;
  }
}
