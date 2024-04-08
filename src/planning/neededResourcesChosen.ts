import type { ResourceId } from '#availability';
import type { TimeSlot } from '#shared';
import { ObjectSet, type Event } from '#utils';
import type { ProjectId } from '.';

export type NeededResourcesChosen = Event<
  'NeededResourcesChosen',
  {
    projectId: ProjectId;
    neededResources: ObjectSet<ResourceId>;
    stageTimeSlot: TimeSlot;
  }
>;
