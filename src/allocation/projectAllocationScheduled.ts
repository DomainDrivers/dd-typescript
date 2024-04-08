import type { TimeSlot } from '#shared';
import type { Event, UUID } from '#utils';
import type { UTCDate } from '@date-fns/utc';
import type { ProjectAllocationsId } from './projectAllocationsId';

export type ProjectAllocationScheduled = Event<
  'ProjectAllocationScheduled',
  {
    projectId: ProjectAllocationsId;
    fromTo: TimeSlot;
    eventId: UUID;
    occurredAt: UTCDate;
  }
>;
