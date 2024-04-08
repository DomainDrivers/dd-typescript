import { type Event } from '#utils';
import type { ProjectId, Demands } from '.';

export type CapabilitiesDemanded = Event<
  'CapabilitiesDemanded',
  {
    projectId: ProjectId;
    demands: Demands;
  }
>;
