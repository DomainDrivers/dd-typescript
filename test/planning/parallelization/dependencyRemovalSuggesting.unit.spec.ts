/* eslint-disable @typescript-eslint/no-floating-promises */
import { Stage, StageParallelization } from '#planning';
import { ObjectSet } from '#utils';
import { describe, it } from 'node:test';
import { assertThat } from '../../asserts';

describe('DependencyRemovalSuggesting', () => {
  const stageParallelization = new StageParallelization();

  it('suggesting breaks the cycle in schedule', () => {
    //given
    let stage1 = new Stage('Stage1');
    let stage2 = new Stage('Stage2');
    let stage3 = new Stage('Stage3');
    let stage4 = new Stage('Stage4');
    stage1 = stage1.dependsOn(stage2);
    stage2 = stage2.dependsOn(stage3);
    stage4 = stage4.dependsOn(stage3);
    stage1 = stage1.dependsOn(stage4);
    stage3 = stage3.dependsOn(stage1);

    //when
    const suggestion = stageParallelization.whatToRemove(
      ObjectSet.from([stage1, stage2, stage3, stage4]),
    );

    //then
    assertThat(suggestion.toString()).isEqualTo('[(3 -> 1), (4 -> 3)]');
  });
});
