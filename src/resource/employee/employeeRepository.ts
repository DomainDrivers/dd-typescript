import { Capability } from '#shared';
import { DrizzleRepository, type Repository } from '#storage';
import { ObjectSet, UUID } from '#utils';
import { eq, inArray } from 'drizzle-orm';
import { Employee, EmployeeId } from '.';
import * as schema from '../schema';
import { EmployeeSummary } from './employeeSummary';
import { Seniority } from './seniority';

export interface EmployeeRepository extends Repository<Employee, EmployeeId> {
  findSummary(employeeId: EmployeeId): Promise<EmployeeSummary>;
  findAllCapabilities(): Promise<Capability[]>;
}

export class DrizzleEmployeeRepository
  extends DrizzleRepository<Employee, EmployeeId, typeof schema>
  implements EmployeeRepository
{
  constructor() {
    super(schema.employees, schema.employees.id, schema.employees.version);
  }

  public findById = async (id: EmployeeId): Promise<Employee | null> => {
    const result = await this.db.query.employees.findFirst({
      where: eq(schema.employees.id, id),
    });

    return result ? mapToEmployee(result) : null;
  };
  public findAllById = async (ids: EmployeeId[]): Promise<Employee[]> => {
    const result = await this.db
      .select()
      .from(schema.employees)
      .where(inArray(schema.employees.id, ids));

    return result.map(mapToEmployee);
  };

  public findSummary = async (
    employeeId: EmployeeId,
  ): Promise<EmployeeSummary> => {
    const employee = await this.getById(employeeId);
    const skills = this.filterCapabilities(employee.capabilities, (cap) =>
      cap.isOfType('SKILL'),
    );
    const permissions = this.filterCapabilities(employee.capabilities, (cap) =>
      cap.isOfType('PERMISSION'),
    );
    return new EmployeeSummary(
      employeeId,
      employee.name,
      employee.lastName,
      employee.seniority,
      skills,
      permissions,
    );
  };

  public findAllCapabilities = async (): Promise<Capability[]> => {
    const result = await this.db.select().from(schema.employees);

    return result.flatMap((d) => d.capabilities).map(mapToCapability);
  };

  private filterCapabilities = (
    capabilities: ObjectSet<Capability>,
    p: (c: Capability) => boolean,
  ): ObjectSet<Capability> => ObjectSet.from(capabilities.filter(p));

  public save = async (employees: Employee): Promise<void> => {
    const entity = mapFromEmployee(employees);
    const { id: _id, ...toUpdate } = entity;

    return this.upsert(entity, toUpdate, {
      id: employees.id,
    });
  };
}

const mapToEmployee = (entity: schema.EmployeeEntity): Employee =>
  new Employee(
    EmployeeId.from(UUID.from(entity.id)),
    entity.name,
    entity.last_name,
    Seniority.from(entity.seniority),
    ObjectSet.from(entity.capabilities.map(mapToCapability)),
    entity.version,
  );

const mapToCapability = ({ name, type }: schema.CapabilityEntity): Capability =>
  new Capability(name, type);

const mapFromEmployee = (employee: Employee): schema.EmployeeEntity => {
  return {
    id: employee.id,
    name: employee.name,
    last_name: employee.lastName,
    seniority: employee.seniority,
    capabilities: employee.capabilities.map(mapFromCapability),
    version: employee.version,
  };
};

const mapFromCapability = (capability: Capability): schema.CapabilityEntity => {
  return {
    name: capability.name,
    type: capability.type,
  };
};
