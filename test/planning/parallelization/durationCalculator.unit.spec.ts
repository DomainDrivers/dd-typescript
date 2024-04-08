import { DurationCalculator, Stage } from '#planning';
import { Duration } from '#utils';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const ZERO = Duration.zero;
const ofDays = Duration.ofDays;
const ofHours = Duration.ofHours;

void describe('DurationCalculator', () => {
  void it('longest stage is taken into account', () => {
    //given
    const stage1 = new Stage('Stage1').ofDuration(ZERO);
    const stage2 = new Stage('Stage2').ofDuration(ofDays(3));
    const stage3 = new Stage('Stage3').ofDuration(ofDays(2));
    const stage4 = new Stage('Stage4').ofDuration(ofDays(5));

    //when
    const duration = DurationCalculator.calculate([
      stage1,
      stage2,
      stage3,
      stage4,
    ]);

    //then
    assert.equal(duration, ofDays(5));
  });

  void it('sum is taken into account when nothing is parallel', () => {
    //given
    const stage1 = new Stage('Stage1').ofDuration(ofHours(10));
    const stage2 = new Stage('Stage2').ofDuration(ofHours(24));
    const stage3 = new Stage('Stage3').ofDuration(ofDays(2));
    const stage4 = new Stage('Stage4').ofDuration(ofDays(1));
    stage4.dependsOn(stage3);
    stage3.dependsOn(stage2);
    stage2.dependsOn(stage1);

    //when
    const duration = DurationCalculator.calculate([
      stage1,
      stage2,
      stage3,
      stage4,
    ]);

    //then
    assert.equal(duration, ofHours(106));
  });
});
