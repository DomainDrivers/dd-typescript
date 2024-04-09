import type { PublishedEvent } from '#utils';
import type { Demands, ProjectId } from '.';

export type CapabilitiesDemanded = PublishedEvent<
  'CapabilitiesDemanded',
  {
    projectId: ProjectId;
    demands: Demands;
  }
>;
