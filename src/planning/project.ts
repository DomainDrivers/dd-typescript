import { TimeSlot } from '#shared';
import { ObjectSet } from '#utils';
import type { UTCDate } from '@date-fns/utc';
import { ChosenResources } from './chosenResources';
import { Demands, DemandsPerStage } from './demands';
import { ParallelStagesList, Stage } from './parallelization';
import { ProjectId } from './projectId';
import { Schedule } from './schedule';

export class Project {
  constructor(
    private name: string,
    private parallelizedStages: ParallelStagesList = ParallelStagesList.empty(),
    private demandsPerStage: DemandsPerStage = DemandsPerStage.empty(),
    private allDemands: Demands = Demands.none(),
    private schedule: Schedule = Schedule.none(),
    private chosenResources: ChosenResources = ChosenResources.none(),
    private version: number = 0,
    private id: ProjectId = ProjectId.newOne(),
  ) {}

  public addDemands = (demands: Demands) => {
    this.allDemands = this.allDemands.add(demands);
  };

  public getAllDemands = () => this.allDemands;

  public getParallelizedStages = () => this.parallelizedStages;

  public addChosenResources = (neededResources: ChosenResources) => {
    this.chosenResources = neededResources;
  };

  public getChosenResources = () => this.chosenResources;

  public addDemandsPerStage = (demandsPerStage: DemandsPerStage) => {
    this.demandsPerStage = demandsPerStage;
    const uniqueDemands = demandsPerStage.demands
      .map((d) => d.value)
      .flatMap((demands) => ObjectSet.from(demands.all));
    this.addDemands(new Demands(uniqueDemands));
  };

  public getDemandsPerStage = () => this.demandsPerStage;

  public addScheduleBasedOnReferenceStageTimeSlot = (
    criticalStage: Stage,
    stageTimeSlot: TimeSlot,
  ) => {
    this.schedule = Schedule.basedOnReferenceStageTimeSlot(
      criticalStage,
      stageTimeSlot,
      this.parallelizedStages,
    );
  };
  public addSchedule = (schedule: Schedule) => {
    this.schedule = schedule;
  };

  public addScheduleBasedOnStartDay = (possibleStartDate: UTCDate) => {
    this.schedule = Schedule.basedOnStartDay(
      possibleStartDate,
      this.parallelizedStages,
    );
  };

  public getSchedule = () => this.schedule;

  public defineStages = (parallelizedStages: ParallelStagesList) => {
    this.parallelizedStages = parallelizedStages;
  };

  public getName = () => this.name;

  public getId = () => this.id;

  public getVersion = () => this.version;
}
