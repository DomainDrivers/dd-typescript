import type { ResourceId } from '#availability';
import type { TimeSlot } from '#shared';
import { ObjectSet, type PublishedEvent } from '#utils';
import type { ProjectId } from '.';

export type NeededResourcesChosen = PublishedEvent<
  'NeededResourcesChosen',
  {
    projectId: ProjectId;
    neededResources: ObjectSet<ResourceId>;
    timeSlot: TimeSlot;
  }
>;
