import type { TimeSlot } from '#shared';
import { deepEquals } from '#utils';
import { Blockade } from './blockade';
import { Owner } from './owner';
import type { ResourceAvailabilityId } from './resourceAvailabilityId';
import type { ResourceId } from './resourceId';

export class ResourceAvailability {
  private _id: ResourceAvailabilityId;
  private _resourceId: ResourceId;
  private _resourceParentId: ResourceId | null;
  private _segment: TimeSlot;
  private _blockade: Blockade;
  private _version: number;

  constructor(
    availabilityId: ResourceAvailabilityId,
    resourceId: ResourceId,
    segment: TimeSlot,
    resourceParentId: ResourceId | null = null,
    blockade?: Blockade,
    version?: number,
  ) {
    this._id = availabilityId;
    this._resourceId = resourceId;
    this._segment = segment;
    this._resourceParentId = resourceParentId;
    this._blockade = blockade ?? Blockade.none();
    this._version = version ?? 0;
  }

  public block(requester: Owner): boolean {
    if (this.isAvailableFor(requester)) {
      this._blockade = Blockade.ownedBy(requester);
      return true;
    } else {
      return false;
    }
  }

  public release = (requester: Owner): boolean => {
    if (this.isAvailableFor(requester)) {
      this._blockade = Blockade.none();
      return true;
    } else {
      return false;
    }
  };

  public disable = (requester: Owner): boolean => {
    this._blockade = Blockade.disabledBy(requester);
    return true;
  };

  public enable = (requester: Owner): boolean => {
    if (this._blockade.canBeTakenBy(requester)) {
      this._blockade = Blockade.none();
      return true;
    }
    return false;
  };

  public isDisabled = (): boolean => this._blockade.disabled;

  private isAvailableFor = (requester: Owner): boolean =>
    this._blockade.canBeTakenBy(requester) && !this.isDisabled();

  public blockedBy = (): Owner => this._blockade.takenBy;

  public isDisabledBy = (owner: Owner): boolean =>
    this._blockade.isDisabledBy(owner);

  public get id(): ResourceAvailabilityId {
    return this._id;
  }

  public get segment(): TimeSlot {
    return this._segment;
  }

  public get resourceId(): ResourceId {
    return this._resourceId;
  }

  public get resourceParentId(): ResourceId | null {
    return this._resourceParentId;
  }

  public get version(): number {
    return this._version;
  }

  public equals(other: ResourceAvailability): boolean {
    return deepEquals(this._id, other.id);
  }
}
