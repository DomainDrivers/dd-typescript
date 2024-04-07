import {
  EmployeeAllocationPolicy,
  EmployeeId,
  EmployeeSummary,
  Seniority,
  type EmployeeRepository,
} from '.';
import { AllocatableCapabilityId, CapabilityScheduler } from '../../allocation';
import type { TimeSlot } from '../../shared';

export class ScheduleEmployeeCapabilities {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly capabilityScheduler: CapabilityScheduler,
  ) {}

  public setupEmployeeCapabilities = async (
    employeeId: EmployeeId,
    timeSlot: TimeSlot,
  ): Promise<AllocatableCapabilityId[]> => {
    const summary = await this.employeeRepository.findSummary(employeeId);
    const policy = this.findAllocationPolicy(summary);
    const capabilities = policy.simultaneousCapabilitiesOf(summary);
    return this.capabilityScheduler.scheduleResourceCapabilitiesForPeriod(
      EmployeeId.toAllocatableResourceId(employeeId),
      capabilities,
      timeSlot,
    );
  };

  private findAllocationPolicy = (
    employee: EmployeeSummary,
  ): EmployeeAllocationPolicy => {
    if (employee.seniority === Seniority.LEAD) {
      return EmployeeAllocationPolicy.simultaneous(
        EmployeeAllocationPolicy.oneOfSkills(),
        EmployeeAllocationPolicy.permissionsInMultipleProjects(3),
      );
    }
    return EmployeeAllocationPolicy.defaultPolicy();
  };
}
