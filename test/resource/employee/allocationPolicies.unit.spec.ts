/* eslint-disable @typescript-eslint/no-floating-promises */
import { CapabilitySelector } from '#allocation';
import {
  EmployeeAllocationPolicy,
  EmployeeId,
  EmployeeSummary,
  Seniority,
} from '#resource';
import { Capability } from '#shared';
import { describe, it } from 'node:test';
import { assertThatArray } from '../../asserts';

const permissionsInMultipleProjects =
  EmployeeAllocationPolicy.permissionsInMultipleProjects;
const simultaneous = EmployeeAllocationPolicy.simultaneous;
const permission = Capability.permission;
const skill = Capability.skill;

describe('AllocationsToProject', () => {
  it('Default policy should return just one skill at once', () => {
    //given
    const employee = new EmployeeSummary(
      EmployeeId.newOne(),
      'resourceName',
      'lastName',
      Seniority.LEAD,
      Capability.skills('JAVA'),
      Capability.permissions('ADMIN'),
    );

    //when
    const capabilities =
      EmployeeAllocationPolicy.defaultPolicy().simultaneousCapabilitiesOf(
        employee,
      );

    //then
    assertThatArray(capabilities).hasSize(1);
    assertThatArray(capabilities[0].capabilities).containsExactlyInAnyOrder(
      skill('JAVA'),
      permission('ADMIN'),
    );
  });

  it('Permissions can be shared between projects', () => {
    //given
    const policy = permissionsInMultipleProjects(3);
    const employee = new EmployeeSummary(
      EmployeeId.newOne(),
      'resourceName',
      'lastName',
      Seniority.LEAD,
      Capability.skills('JAVA'),
      Capability.permissions('ADMIN'),
    );

    //when
    const capabilities = policy.simultaneousCapabilitiesOf(employee);

    //then
    assertThatArray(capabilities).hasSize(3);

    assertThatArray(
      capabilities.flatMap((cap) => cap.capabilities),
    ).containsExactlyInAnyOrder(
      permission('ADMIN'),
      permission('ADMIN'),
      permission('ADMIN'),
    );
  });

  it('Can create composite policy', () => {
    //given
    const policy = simultaneous(
      permissionsInMultipleProjects(3),
      EmployeeAllocationPolicy.oneOfSkills(),
    );
    const employee = new EmployeeSummary(
      EmployeeId.newOne(),
      'resourceName',
      'lastName',
      Seniority.LEAD,
      Capability.skills('JAVA', 'PYTHON'),
      Capability.permissions('ADMIN'),
    );

    //when
    const capabilities = policy.simultaneousCapabilitiesOf(employee);

    //then
    assertThatArray(capabilities).hasSize(4);
    assertThatArray(capabilities).containsExactlyInAnyOrder(
      CapabilitySelector.canPerformOneOf(Capability.skills('JAVA', 'PYTHON')),
      CapabilitySelector.canJustPerform(permission('ADMIN')),
      CapabilitySelector.canJustPerform(permission('ADMIN')),
      CapabilitySelector.canJustPerform(permission('ADMIN')),
    );
  });
});
