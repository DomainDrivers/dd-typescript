import type { DeviceFacade } from './device';
import type { EmployeeFacade } from './employee/employeeFacade';
import { ResourceFacade } from './resourceFacade';

export class ResourceConfiguration {
  constructor(
    public readonly connectionString: string,
    private readonly enableLogging: boolean = false,
  ) {
    console.log('connectionstring: ' + this.connectionString);
  }

  resourceFacade = (
    employeeFacade: EmployeeFacade,
    deviceFacade: DeviceFacade,
  ) => new ResourceFacade(employeeFacade, deviceFacade);
}
