import { Capability } from '#shared';
import { ObjectSet } from '#utils';
import { CapabilitySelector } from '..';
import type { EmployeeDataFromLegacyEsbMessage } from './employeeCreatedInLegacySystemMessageHandler';

const multiplePermission = (
  permissionLegacyCode: string,
): CapabilitySelector[] => {
  const parts = permissionLegacyCode.split('<>');
  const permission = parts[0];
  const times = parseInt(parts[1]);

  return [...Array(times).keys()].map(() =>
    CapabilitySelector.canJustPerform(Capability.permission(permission)),
  );
};

export const TranslateToCapabilitySelector = {
  translate: (
    message: EmployeeDataFromLegacyEsbMessage,
  ): CapabilitySelector[] => {
    const employeeSkills = message.skillsPerformedTogether.map((skills) =>
      CapabilitySelector.canPerformAllAtTheTime(
        ObjectSet.from(skills.map(Capability.skill)),
      ),
    );
    const employeeExclusiveSkills = message.exclusiveSkills.map((skill) =>
      CapabilitySelector.canJustPerform(Capability.skill(skill)),
    );
    const employeePermissions = message.permissions

      .map(multiplePermission)
      .flatMap((c) => c);
    //schedule or rewrite if exists;
    return [
      ...employeeSkills,
      ...employeeExclusiveSkills,
      ...employeePermissions,
    ];
  },
};
