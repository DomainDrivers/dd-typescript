import type { ParallelStages } from '..';

export class ParallelStagesList {
  constructor(public readonly all: ParallelStages[]) {}

  public static of(...stages: ParallelStages[]): ParallelStagesList {
    return new ParallelStagesList(stages);
  }

  public print() {
    return this.all.map((stages) => stages.print()).join(' | ');
  }
}
