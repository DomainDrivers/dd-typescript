import type { ResourceId } from '#availability';
import type { TimeSlot } from '#shared';
import { type Event } from '#utils';
import type { ProjectId } from '.';

export type CriticalStagePlanned = Event<
  'CriticalStagePlanned',
  {
    projectId: ProjectId;
    stageTimeSlot: TimeSlot;
    criticalResource: ResourceId | null;
  }
>;
