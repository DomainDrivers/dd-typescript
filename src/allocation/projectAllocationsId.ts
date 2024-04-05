import { UUID, type Brand } from '#utils';

export type ProjectAllocationsId = Brand<UUID, 'ProjectAllocationsId'>;

export const ProjectAllocationsId = {
  newOne: (): ProjectAllocationsId => UUID.randomUUID() as ProjectAllocationsId,

  from: (key: UUID): ProjectAllocationsId => key as ProjectAllocationsId,
};
