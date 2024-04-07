import type { Capability, TimeSlot } from '#shared';
import type { ObjectSet } from '#utils';
import { AllocatableCapabilityId } from './allocatableCapabilityId';
import type { AllocatableResourceId } from './allocatableResourceId';
import type { CapabilitySelector } from './capabilitySelector';

export class AllocatableCapability {
  private _id: AllocatableCapabilityId;
  private _resourceId: AllocatableResourceId;
  private _possibleCapabilities: CapabilitySelector;
  private _timeSlot: TimeSlot;

  constructor(
    resourceId: AllocatableResourceId,
    possibleCapabilities: CapabilitySelector,
    timeSlot: TimeSlot,
    id: AllocatableCapabilityId = AllocatableCapabilityId.newOne(),
  ) {
    this._id = id;
    this._resourceId = resourceId;
    this._possibleCapabilities = possibleCapabilities;
    this._timeSlot = timeSlot;
  }

  public canPerform = (capabilities: ObjectSet<Capability>): boolean =>
    this._possibleCapabilities.canPerform(...capabilities);

  public get id() {
    return this._id;
  }
  public get resourceId() {
    return this._resourceId;
  }

  public get slot() {
    return this._timeSlot;
  }

  public get capabilities() {
    return this._possibleCapabilities;
  }
}
