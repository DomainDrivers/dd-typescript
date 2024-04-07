import type { Capability, TimeSlot } from '#shared';
import { deepEquals } from '#utils';
import { AllocatableCapabilityId } from './allocatableCapabilityId';
import type { AllocatableResourceId } from './allocatableResourceId';

export class AllocatableCapability {
  #id: AllocatableCapabilityId;
  #resourceId: AllocatableResourceId;
  #capability: Capability;
  #timeSlot: TimeSlot;

  constructor(
    resourceId: AllocatableResourceId,
    capability: Capability,
    timeSlot: TimeSlot,
    id: AllocatableCapabilityId = AllocatableCapabilityId.newOne(),
  ) {
    this.#id = id;
    this.#resourceId = resourceId;
    this.#capability = capability;
    this.#timeSlot = timeSlot;
  }

  public canPerform = (capability: Capability): boolean =>
    deepEquals(capability, capability);

  public get id() {
    return this.#id;
  }
  public get resourceId() {
    return this.#resourceId;
  }

  public get slot() {
    return this.#timeSlot;
  }

  public get capability() {
    return this.#capability;
  }
}
