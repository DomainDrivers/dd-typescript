import { ObjectSet, type Event } from '#utils';
import { Owner, ResourceId } from '.';
import { TimeSlot } from '../shared';

export type ResourceTakenOver = Event<
  'ResourceTakenOver',
  {
    resourceId: ResourceId;
    previousOwners: ObjectSet<Owner>;
    slot: TimeSlot;
  }
>;
