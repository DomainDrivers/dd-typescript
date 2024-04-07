import { Capability } from '#shared';
import { ObjectSet } from '#utils';
import { dbconnection, transactional } from '../../storage';
import { Employee } from './employee';
import { EmployeeId } from './employeeId';
import type { EmployeeRepository } from './employeeRepository';
import type { EmployeeSummary } from './employeeSummary';
import type { Seniority } from './seniority';

export class EmployeeFacade {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  @dbconnection
  public findEmployee(employeeId: EmployeeId): Promise<EmployeeSummary> {
    return this.employeeRepository.findSummary(employeeId);
  }

  @dbconnection
  public findAllCapabilities(): Promise<Capability[]> {
    return this.employeeRepository.findAllCapabilities();
  }

  @transactional
  public async addEmployee(
    name: string,
    lastName: string,
    seniority: Seniority,
    skills: ObjectSet<Capability>,
    permissions: ObjectSet<Capability>,
  ): Promise<EmployeeId> {
    const employeeId = EmployeeId.newOne();
    const capabilities = ObjectSet.from([...skills, ...permissions]);
    const employee = new Employee(
      employeeId,
      name,
      lastName,
      seniority,
      capabilities,
    );
    await this.employeeRepository.save(employee);
    return employeeId;
  }

  //add vacation
  // calls availability
  //add sick leave
  // calls availability
  //change skills
}
