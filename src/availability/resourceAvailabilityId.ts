import { UUID } from '#utils';

export type ResourceAvailabilityId = UUID<'ResourceAvailabilityId'>;

export const ResourceAvailabilityId = {
  newOne: (): ResourceAvailabilityId =>
    UUID.randomUUID() as ResourceAvailabilityId,

  from: (key: UUID): ResourceAvailabilityId => key as ResourceAvailabilityId,
};
