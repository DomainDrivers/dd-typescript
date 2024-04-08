import { ObjectSet, type PublishedEvent } from '#utils';
import { Owner, ResourceId } from '.';
import { TimeSlot } from '../shared';

export type ResourceTakenOver = PublishedEvent<
  'ResourceTakenOver',
  {
    resourceId: ResourceId;
    previousOwners: ObjectSet<Owner>;
    slot: TimeSlot;
  }
>;
