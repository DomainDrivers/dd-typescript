import { DeviceConfiguration, DeviceFacade } from './device';
import { EmployeeConfiguration, EmployeeFacade } from './employee';
import { ResourceFacade } from './resourceFacade';

export class ResourceConfiguration {
  constructor(
    public readonly connectionString: string,
    private readonly enableLogging: boolean = false,
    private readonly employeeConfiguration: EmployeeConfiguration = new EmployeeConfiguration(
      connectionString,
    ),
    private readonly deviceConfiguration: DeviceConfiguration = new DeviceConfiguration(
      connectionString,
    ),
  ) {}

  resourceFacade = (
    employeeFacade?: EmployeeFacade,
    deviceFacade?: DeviceFacade,
  ) =>
    new ResourceFacade(
      employeeFacade ?? this.employeeConfiguration.employeeFacade(),
      deviceFacade ?? this.deviceConfiguration.deviceFacade(),
    );
}
