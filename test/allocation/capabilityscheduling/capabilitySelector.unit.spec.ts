import { CapabilitySelector } from '#allocation';
import { Capability } from '#shared';
import { ObjectSet } from '#utils';
import { describe, it } from 'node:test';
import { assertFalse, assertTrue } from '../../asserts';

void describe('CapabilitySelector', () => {
  const RUST = new Capability('RUST', 'SKILL');
  const BEING_AN_ADMIN = new Capability('ADMIN', 'PERMISSION');
  const JAVA = new Capability('JAVA', 'SKILL');

  void it('allocatable Resource can perform only one of present capabilities', () => {
    //given
    const adminOrRust = CapabilitySelector.canPerformOneOf(
      ObjectSet.of(BEING_AN_ADMIN, RUST),
    );

    //expect
    assertTrue(adminOrRust.canPerform(BEING_AN_ADMIN));
    assertTrue(adminOrRust.canPerform(RUST));
    assertFalse(adminOrRust.canPerform(RUST, BEING_AN_ADMIN));
    assertFalse(adminOrRust.canPerform(new Capability('JAVA', 'SKILL')));
    assertFalse(adminOrRust.canPerform(new Capability('LAWYER', 'PERMISSION')));
  });

  void it('allocatable Resource can perform simultaneous capabilities', () => {
    //given
    const adminAndRust = CapabilitySelector.canPerformAllAtTheTime(
      ObjectSet.of(BEING_AN_ADMIN, RUST),
    );

    //expect
    assertTrue(adminAndRust.canPerform(BEING_AN_ADMIN));
    assertTrue(adminAndRust.canPerform(RUST));
    assertTrue(adminAndRust.canPerform(RUST, BEING_AN_ADMIN));
    assertFalse(adminAndRust.canPerform(RUST, BEING_AN_ADMIN, JAVA));
    assertFalse(adminAndRust.canPerform(JAVA));
    assertFalse(
      adminAndRust.canPerform(new Capability('LAWYER', 'PERMISSION')),
    );
  });
});
