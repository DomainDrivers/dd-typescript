import { EmployeeSummary } from '.';
import { CapabilitySelector } from '../../allocation';
import { ObjectSet } from '../../utils';

export interface EmployeeAllocationPolicy {
  simultaneousCapabilitiesOf(employee: EmployeeSummary): CapabilitySelector[];
}

export const EmployeeAllocationPolicy = {
  defaultPolicy: (): EmployeeAllocationPolicy => {
    return {
      simultaneousCapabilitiesOf: (employee) => {
        const all = ObjectSet.from([
          ...employee.skills,
          ...employee.permissions,
        ]);

        return [CapabilitySelector.canPerformOneOf(all)];
      },
    };
  },
  permissionsInMultipleProjects: (
    howMany: number,
  ): EmployeeAllocationPolicy => {
    return {
      simultaneousCapabilitiesOf: (employee) =>
        employee.permissions
          .flatMap((permission) =>
            [...Array(howMany).keys()].map(() => permission),
          )
          .map((c) => CapabilitySelector.canJustPerform(c)),
    };
  },
  oneOfSkills: (): EmployeeAllocationPolicy => {
    return {
      simultaneousCapabilitiesOf: (employee) => [
        CapabilitySelector.canPerformOneOf(employee.skills),
      ],
    };
  },
  simultaneous: (...policies: EmployeeAllocationPolicy[]): CompositePolicy =>
    new CompositePolicy(policies),
};

export class CompositePolicy implements EmployeeAllocationPolicy {
  constructor(private readonly policies: EmployeeAllocationPolicy[]) {}

  public simultaneousCapabilitiesOf = (
    employee: EmployeeSummary,
  ): CapabilitySelector[] =>
    this.policies.flatMap((p) => p.simultaneousCapabilitiesOf(employee));
}
