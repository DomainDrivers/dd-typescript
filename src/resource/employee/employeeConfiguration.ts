import {
  CapabilityPlanningConfiguration,
  type CapabilityScheduler,
} from '#allocation';
import { getDB, injectDatabaseContext } from '#storage';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import { EmployeeFacade } from './employeeFacade';
import {
  DrizzleEmployeeRepository,
  type EmployeeRepository,
} from './employeeRepository';
import { ScheduleEmployeeCapabilities } from './scheduleEmployeeCapabilities';

export class EmployeeConfiguration {
  constructor(
    public readonly connectionString: string,
    private readonly enableLogging: boolean = false,
  ) {
    console.log('connectionstring: ' + this.connectionString);
  }

  employeeFacade = (
    employeeRepository?: EmployeeRepository,
    capabilityScheduler?: CapabilityScheduler,
  ): EmployeeFacade => {
    employeeRepository = employeeRepository ?? this.employeeRepository();
    return injectDatabaseContext(
      new EmployeeFacade(
        employeeRepository,
        new ScheduleEmployeeCapabilities(
          employeeRepository,
          capabilityScheduler ??
            new CapabilityPlanningConfiguration(
              this.connectionString,
              this.enableLogging,
            ).capabilityScheduler(),
        ),
      ),
      this.db,
    );
  };

  public employeeRepository = (): EmployeeRepository =>
    new DrizzleEmployeeRepository();

  public db = (cs?: string): NodePgDatabase<typeof schema> =>
    getDB(cs ?? this.connectionString, { schema, logger: this.enableLogging });
}
