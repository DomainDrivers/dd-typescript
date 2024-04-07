import { ResourceId } from '#availability';
import { UUID } from '#utils';

export type AllocatableCapabilityId = UUID<'AllocatableCapabilityId'>;

export const AllocatableCapabilityId = {
  newOne: (): AllocatableCapabilityId =>
    UUID.randomUUID() as AllocatableCapabilityId,

  from: (key: UUID): AllocatableCapabilityId => key as AllocatableCapabilityId,

  toAvailabilityResourceId: (id: AllocatableCapabilityId) =>
    ResourceId.from(id),
};
