import type { TimeSlot } from '#shared';
import { UUID } from '#utils';
import type { UTCDate } from '@date-fns/utc';
import type { ProjectAllocationsId } from './projectAllocationsId';

export class ProjectAllocationScheduled {
  constructor(
    public readonly projectId: ProjectAllocationsId,
    public readonly fromTo: TimeSlot,
    public readonly occurredAt: UTCDate,
    public readonly eventId: UUID = UUID.randomUUID(),
  ) {}
}
