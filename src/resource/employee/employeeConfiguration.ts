import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { getDB, injectDatabaseContext } from '../../storage';
import * as schema from '../schema';
import { EmployeeFacade } from './employeeFacade';
import {
  DrizzleEmployeeRepository,
  type EmployeeRepository,
} from './employeeRepository';

export class EmployeeConfiguration {
  constructor(
    public readonly connectionString: string,
    private readonly enableLogging: boolean = false,
  ) {
    console.log('connectionstring: ' + this.connectionString);
  }

  employeeFacade = (employeeRepository?: EmployeeRepository): EmployeeFacade =>
    injectDatabaseContext(
      new EmployeeFacade(employeeRepository ?? this.employeeRepository()),
      this.db,
    );

  public employeeRepository = (): EmployeeRepository =>
    new DrizzleEmployeeRepository();

  public db = (cs?: string): NodePgDatabase<typeof schema> =>
    getDB(cs ?? this.connectionString, { schema, logger: this.enableLogging });
}
