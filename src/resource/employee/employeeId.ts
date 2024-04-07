import { UUID } from '#utils';
import { AllocatableResourceId } from '../../allocation';

export type EmployeeId = UUID<'EmployeeId'>;

export const EmployeeId = {
  newOne: (): EmployeeId => UUID.randomUUID() as EmployeeId,

  from: (key: UUID): EmployeeId => key as EmployeeId,

  toAllocatableResourceId: (deviceId: EmployeeId) =>
    AllocatableResourceId.from(deviceId),
};
