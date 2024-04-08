import {
  CapabilitySelector,
  EmployeeDataFromLegacyEsbMessage,
  TranslateToCapabilitySelector,
} from '#allocation';
import { Capability, TimeSlot } from '#shared';
import { ObjectSet, UUID } from '#utils';
import { describe, it } from 'node:test';
import { assertThatArray } from '../../../asserts';

const canPerformOneOf = CapabilitySelector.canPerformOneOf;
const permission = Capability.permission;
const skill = Capability.skill;

void describe('TranslateToCapabilitySelector', () => {
  void it('Translate legacy esb message to capability selector model', () => {
    //given
    const legacyPermissions = ['ADMIN<>2', 'ROOT<>1'];
    const legacySkillsPerformedTogether = [
      ['JAVA', 'CSHARP', 'PYTHON'],
      ['RUST', 'CSHARP', 'PYTHON'],
    ];
    const legacyExclusiveSkills = ['YT DRAMA COMMENTS'];

    //when
    const result = translate(
      legacySkillsPerformedTogether,
      legacyExclusiveSkills,
      legacyPermissions,
    );

    //then
    assertThatArray(result).containsExactlyInAnyOrder(
      canPerformOneOf(ObjectSet.of(skill('YT DRAMA COMMENTS'))),
      CapabilitySelector.canPerformAllAtTheTime(
        Capability.skills('JAVA', 'CSHARP', 'PYTHON'),
      ),
      CapabilitySelector.canPerformAllAtTheTime(
        Capability.skills('RUST', 'CSHARP', 'PYTHON'),
      ),
      canPerformOneOf(ObjectSet.of(permission('ADMIN'))),
      canPerformOneOf(ObjectSet.of(permission('ADMIN'))),
      canPerformOneOf(ObjectSet.of(permission('ROOT'))),
    );
  });

  void it('Zero means no permission nowhere', () => {
    const legacyPermissions = ['ADMIN<>0'];

    //when
    const result = translate([], [], legacyPermissions);

    //then
    assertThatArray(result).isEmpty();
  });

  const translate = (
    legacySkillsPerformedTogether: Array<string[]>,
    legacyExclusiveSkills: string[],
    legacyPermissions: string[],
  ) => {
    return TranslateToCapabilitySelector.translate(
      new EmployeeDataFromLegacyEsbMessage(
        UUID.randomUUID(),
        legacySkillsPerformedTogether,
        legacyExclusiveSkills,
        legacyPermissions,
        TimeSlot.empty(),
      ),
    );
  };
});
