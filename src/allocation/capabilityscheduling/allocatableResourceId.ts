import { UUID } from '#utils';

export type AllocatableResourceId = UUID<'AllocatableResourceId'>;

export const AllocatableResourceId = {
  newOne: (): AllocatableResourceId =>
    UUID.randomUUID() as AllocatableResourceId,

  from: (key: UUID): AllocatableResourceId => key as AllocatableResourceId,
};
