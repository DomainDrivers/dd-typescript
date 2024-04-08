import {
  CapabilityPlanningConfiguration,
  type CapabilityScheduler,
} from '#allocation';
import { getDB, injectDatabase } from '#storage';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { UtilsConfiguration } from '../../utils';
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
    public readonly utils: UtilsConfiguration,
    public readonly capabilityPlanningConfiguration: CapabilityPlanningConfiguration = new CapabilityPlanningConfiguration(
      connectionString,
    ),
  ) {}

  employeeFacade = (
    employeeRepository?: EmployeeRepository,
    capabilityScheduler?: CapabilityScheduler,
  ): EmployeeFacade => {
    employeeRepository = employeeRepository ?? this.employeeRepository();
    return injectDatabase(
      new EmployeeFacade(
        employeeRepository,
        new ScheduleEmployeeCapabilities(
          employeeRepository,
          capabilityScheduler ??
            this.capabilityPlanningConfiguration.capabilityScheduler(),
        ),
      ),
      this.db(),
      this.utils.eventBus.commit,
    );
  };

  public employeeRepository = (): EmployeeRepository =>
    new DrizzleEmployeeRepository();

  public db = (cs?: string): NodePgDatabase<typeof schema> =>
    getDB(cs ?? this.connectionString, { schema });
}
