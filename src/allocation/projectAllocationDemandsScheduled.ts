import { UUID, type Event } from '#utils';
import type { UTCDate } from '@date-fns/utc';
import type { Demands } from './demands';
import type { ProjectAllocationsId } from './projectAllocationsId';

export type ProjectAllocationsDemandsScheduled = Event<
  'ProjectAllocationsDemandsScheduled',
  {
    projectId: ProjectAllocationsId;
    missingDemands: Demands;
    eventId: UUID;
    occurredAt: UTCDate;
  }
>;
