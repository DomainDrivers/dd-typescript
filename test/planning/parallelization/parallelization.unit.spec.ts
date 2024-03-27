/* eslint-disable @typescript-eslint/no-floating-promises */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { StageParallelization } from '../../../src/parallelization/index.js';
import { Stage } from '../../../src/parallelization/stage.js';

describe('Parallelization Test', () => {
  it('everything can be done in parallel when there are no dependencies', () => {
    //given
    const stage1 = new Stage('Stage1');
    const stage2 = new Stage('Stage2');

    //when
    const sortedStages = StageParallelization.of(new Set([stage1, stage2]));

    //then
    assert.equal(sortedStages.all.length, 1);
  });

  it('test simple dependencies', () => {
    //given
    const stage1 = new Stage('Stage1');
    const stage2 = new Stage('Stage2');
    const stage3 = new Stage('Stage3');
    const stage4 = new Stage('Stage4');
    stage2.dependsOn(stage1);
    stage3.dependsOn(stage1);
    stage4.dependsOn(stage2);

    //when
    const sortedStages = StageParallelization.of(
      new Set([stage1, stage2, stage3, stage4]),
    );

    //then
    assert.equal(sortedStages.print(), 'Stage1 | Stage2, Stage3 | Stage4');
  });

  it('cantBeDoneWhenThereIsACycle ', () => {
    //given
    const stage1 = new Stage('Stage1');
    const stage2 = new Stage('Stage2');
    stage2.dependsOn(stage1);
    stage1.dependsOn(stage2); // making it cyclic

    //when
    const sortedStages = StageParallelization.of(new Set([stage1, stage2]));

    //then
    assert.equal(sortedStages.all.length, 0);
  });
});
