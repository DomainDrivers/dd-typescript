import { UUID, type Brand } from '../utils';

export type ProjectId = Brand<UUID, 'ProjectId'>;

export const ProjectId = {
  newOne: (): ProjectId => UUID.randomUUID() as ProjectId,
};
