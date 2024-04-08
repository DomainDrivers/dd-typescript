import { type PrivateEvent } from '#utils';
import type { Demands } from './demands';
import type { ProjectAllocationsId } from './projectAllocationsId';

export type CapabilityReleased = PrivateEvent<
  'CapabilityReleased',
  {
    projectId: ProjectAllocationsId;
    missingDemands: Demands;
  }
>;
