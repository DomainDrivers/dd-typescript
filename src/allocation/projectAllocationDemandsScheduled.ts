import { UUID } from '#utils';
import type { UTCDate } from '@date-fns/utc';
import type { Demands } from './demands';
import type { ProjectAllocationsId } from './projectAllocationsId';

export class ProjectAllocationsDemandsScheduled {
  constructor(
    public readonly projectId: ProjectAllocationsId,
    public readonly missingDemands: Demands,
    public readonly occurredAt: UTCDate,
    public readonly eventId: UUID = UUID.randomUUID(),
  ) {}
}
