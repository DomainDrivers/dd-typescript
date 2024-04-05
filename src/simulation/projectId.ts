import { UUID } from '#utils';

export type ProjectId = UUID<'ProjectId'>;

export const ProjectId = {
  newOne: (): ProjectId => UUID.randomUUID() as ProjectId,

  from: (key: UUID): ProjectId => key as ProjectId,
};
