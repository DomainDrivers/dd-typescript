import { UUID } from '#utils';
import type { UTCDate } from '@date-fns/utc';
import type { Demands } from './demands';
import type { ProjectAllocationsId } from './projectAllocationsId';

export class CapabilitiesAllocated {
  constructor(
    public readonly allocatedCapabilityId: UUID,
    public readonly projectId: ProjectAllocationsId,
    public readonly missingDemands: Demands,
    public readonly occurredAt: UTCDate,
    public readonly eventId: UUID = UUID.randomUUID(),
  ) {}
}
