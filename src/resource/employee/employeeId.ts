import { UUID } from '#utils';

export type EmployeeId = UUID<'EmployeeId'>;

export const EmployeeId = {
  newOne: (): EmployeeId => UUID.randomUUID() as EmployeeId,

  from: (key: UUID): EmployeeId => key as EmployeeId,
};
