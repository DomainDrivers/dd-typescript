import { ChosenResources } from './chosenResources';
import { Demands, DemandsPerStage } from './demands';
import type { ParallelStagesList } from './parallelization';
import type { ProjectId } from './projectId';
import { Schedule } from './schedule';

export class ProjectCard {
  constructor(
    public readonly projectId: ProjectId,
    public readonly name: string,
    public readonly parallelizedStages: ParallelStagesList,
    public readonly demands: Demands,
    public readonly schedule: Schedule = Schedule.none(),
    public readonly demandsPerStage: DemandsPerStage = DemandsPerStage.empty(),
    public readonly neededResources: ChosenResources = ChosenResources.none(),
  ) {}
}
