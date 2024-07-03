import { ResourceId } from '#availability';
import { Stage, StageParallelization } from '#planning';
import { ObjectSet } from '#utils';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

void describe('Parallelization', () => {
  const LEON = ResourceId.newOne();
  const ERYK = ResourceId.newOne();
  const SLAWEK = ResourceId.newOne();
  const KUBA = ResourceId.newOne();

  void it('everything can be done in parallel when there are no dependencies', () => {
    //given
    const stage1 = new Stage('Stage1');
    const stage2 = new Stage('Stage2');

    //when
    const sortedStages = new StageParallelization().of(
      ObjectSet.from([stage1, stage2]),
    );

    //then
    assert.equal(sortedStages.all.length, 1);
  });

  void it('test simple dependencies', () => {
    //given
    const stage1 = new Stage('Stage1');
    let stage2 = new Stage('Stage2');
    let stage3 = new Stage('Stage3');
    let stage4 = new Stage('Stage4');
    stage2 = stage2.dependsOn(stage1);
    stage3 = stage3.dependsOn(stage1);
    stage4 = stage4.dependsOn(stage2);

    //when
    const sortedStages = new StageParallelization().of(
      ObjectSet.from([stage1, stage2, stage3, stage4]),
    );

    //then
    assert.equal(sortedStages.print(), 'Stage1 | Stage2, Stage3 | Stage4');
  });

  void it(`can't be done when there is a cycle`, () => {
    //given
    let stage1 = new Stage('Stage1');
    let stage2 = new Stage('Stage2');
    stage2 = stage2.dependsOn(stage1);
    stage1 = stage1.dependsOn(stage2); // making it cyclic

    //when
    const sortedStages = new StageParallelization().of(
      ObjectSet.from([stage1, stage2]),
    );

    //then
    assert.equal(sortedStages.all.length, 0);
  });

  void it('takes into account shared resources', () => {
    //given
    const stage1 = new Stage('Stage1').withChosenResourceCapabilities(LEON);
    const stage2 = new Stage('Stage2').withChosenResourceCapabilities(
      ERYK,
      LEON,
    );
    const stage3 = new Stage('Stage3').withChosenResourceCapabilities(SLAWEK);
    const stage4 = new Stage('Stage4').withChosenResourceCapabilities(
      SLAWEK,
      KUBA,
    );

    //when
    const parallelStages = new StageParallelization().of(
      ObjectSet.from([stage1, stage2, stage3, stage4]),
    );

    //then
    assert.ok(
      [
        'Stage1, Stage3 | Stage2, Stage4',
        'Stage2, Stage4 | Stage1, Stage3',
      ].some((t) => t === parallelStages.print()),
    );
  });
});
