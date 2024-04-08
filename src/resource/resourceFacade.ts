import { Capability } from '#shared';
import type { DeviceFacade } from './device';
import type { EmployeeFacade } from './employee/employeeFacade';

export class ResourceFacade {
  constructor(
    private readonly employeeFacade: EmployeeFacade,
    private readonly deviceFacade: DeviceFacade,
  ) {}

  public async findAllCapabilities(): Promise<Capability[]> {
    const employeeCapabilities =
      await this.employeeFacade.findAllCapabilities();
    const deviceCapabilities = await this.deviceFacade.findAllCapabilities();
    return [...employeeCapabilities, ...deviceCapabilities];
  }
}
