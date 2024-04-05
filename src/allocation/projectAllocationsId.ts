import { UUID } from '#utils';

export type ProjectAllocationsId = UUID<'ProjectAllocationsId'>;

export const ProjectAllocationsId = {
  newOne: (): ProjectAllocationsId => UUID.randomUUID() as ProjectAllocationsId,

  from: (key: UUID): ProjectAllocationsId => key as ProjectAllocationsId,
};
