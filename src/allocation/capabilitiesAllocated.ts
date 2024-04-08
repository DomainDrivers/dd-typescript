import { UUID, type PrivateEvent } from '#utils';
import type { Demands } from './demands';
import type { ProjectAllocationsId } from './projectAllocationsId';

export type CapabilitiesAllocated = PrivateEvent<
  'CapabilitiesAllocated',
  {
    allocatedCapabilityId: UUID;
    projectId: ProjectAllocationsId;
    missingDemands: Demands;
  }
>;
