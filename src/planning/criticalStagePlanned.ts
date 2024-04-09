import type { ResourceId } from '#availability';
import type { TimeSlot } from '#shared';
import { type PublishedEvent } from '#utils';
import type { ProjectId } from '.';

export type CriticalStagePlanned = PublishedEvent<
  'CriticalStagePlanned',
  {
    projectId: ProjectId;
    stageTimeSlot: TimeSlot;
    criticalResource: ResourceId;
  }
>;
