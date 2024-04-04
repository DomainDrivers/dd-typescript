import { UUID, type Brand } from '#utils';

export type ResourceId = Brand<UUID, 'ResourceId'>;

export const ResourceId = {
  newOne: (): ResourceId => UUID.randomUUID() as ResourceId,

  from: (key: UUID): ResourceId => key as ResourceId,
};
