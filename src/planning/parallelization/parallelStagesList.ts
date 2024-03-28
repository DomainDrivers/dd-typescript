import type { ParallelStages } from './parallelStages';

export class ParallelStagesList {
  constructor(public readonly all: ParallelStages[]) {}

  public static empty = () => new ParallelStagesList([]);

  public static of = (...stages: ParallelStages[]) =>
    new ParallelStagesList(stages);

  public print = () => this.all.map((stages) => stages.print()).join(' | ');

  public add = (newParallelStages: ParallelStages): ParallelStagesList => {
    const result = [...this.all, newParallelStages];

    return new ParallelStagesList(result);
  };
}
