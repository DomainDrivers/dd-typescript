import type { Capability } from '#shared';
import { ObjectSet } from '#utils';
import { EmployeeId } from './employeeId';
import { Seniority } from './seniority';

export class EmployeeSummary {
  constructor(
    public readonly id: EmployeeId,
    public readonly name: string,
    public readonly lastName: string,
    public readonly seniority: Seniority,
    public readonly skills: ObjectSet<Capability>,
    public readonly permissions: ObjectSet<Capability>,
  ) {}
}
