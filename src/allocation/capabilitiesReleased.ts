import { UUID, type Event } from '#utils';
import type { UTCDate } from '@date-fns/utc';
import type { Demands } from './demands';
import type { ProjectAllocationsId } from './projectAllocationsId';

export type CapabilityReleased = Event<
  'CapabilityReleased',
  {
    projectId: ProjectAllocationsId;
    missingDemands: Demands;
    occurredAt: UTCDate;
    eventId: UUID;
  }
>;
