import { UUID } from '#utils';

export type ResourceId = UUID<'ResourceId'>;

export const ResourceId = {
  newOne: (): ResourceId => UUID.randomUUID() as ResourceId,

  from: (key: UUID): ResourceId => key as ResourceId,
};
