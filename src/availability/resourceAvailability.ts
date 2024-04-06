import type { TimeSlot } from '#shared';
import { deepEquals } from '#utils';
import { Blockade } from './blockade';
import { Owner } from './owner';
import type { ResourceAvailabilityId } from './resourceAvailabilityId';

export class ResourceAvailability {
  #id: ResourceAvailabilityId;
  #resourceId: ResourceAvailabilityId;
  #resourceParentId: ResourceAvailabilityId | null;
  #segment: TimeSlot;
  #blockade: Blockade;
  #version: number;

  constructor(
    availabilityId: ResourceAvailabilityId,
    resourceId: ResourceAvailabilityId,
    segment: TimeSlot,
    resourceParentId: ResourceAvailabilityId | null = null,
    blockade?: Blockade,
    version?: number,
  ) {
    this.#id = availabilityId;
    this.#resourceId = resourceId;
    this.#segment = segment;
    this.#resourceParentId = resourceParentId;
    this.#blockade = blockade ?? Blockade.none();
    this.#version = version ?? 0;
  }

  public block(requester: Owner): boolean {
    if (this.isAvailableFor(requester)) {
      this.#blockade = Blockade.ownedBy(requester);
      return true;
    } else {
      return false;
    }
  }

  public release = (requester: Owner): boolean => {
    if (this.isAvailableFor(requester)) {
      this.#blockade = Blockade.none();
      return true;
    } else {
      return false;
    }
  };

  public disable = (requester: Owner): boolean => {
    this.#blockade = Blockade.disabledBy(requester);
    return true;
  };

  public enable = (requester: Owner): boolean => {
    if (this.#blockade.canBeTakenBy(requester)) {
      this.#blockade = Blockade.none();
      return true;
    }
    return false;
  };

  public isDisabled = (): boolean => this.#blockade.disabled;

  private isAvailableFor = (requester: Owner): boolean =>
    this.#blockade.canBeTakenBy(requester) && !this.isDisabled();

  public blockedBy = (): Owner => this.#blockade.takenBy;

  public isDisabledBy = (owner: Owner): boolean =>
    this.#blockade.isDisabledBy(owner);

  public get id(): ResourceAvailabilityId {
    return this.#id;
  }

  public get segment(): TimeSlot {
    return this.#segment;
  }

  public get resourceId(): ResourceAvailabilityId {
    return this.#resourceId;
  }

  public get resourceParentId(): ResourceAvailabilityId | null {
    return this.#resourceParentId;
  }

  public get version(): number {
    return this.#version;
  }

  public equals(other: ResourceAvailability): boolean {
    return deepEquals(this.#id, other.id);
  }
}
