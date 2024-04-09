import type { KeyValue } from '#utils';

export type StageEntity = {
  stageName: string;
  dependencies: StageEntity[];
  resources: string[];
  duration: number;
};

export type ParallelStagesEntity = { stages: StageEntity[] };

export type ParallelStagesListEntity = {
  all: ParallelStagesEntity[];
};

export type ChosenResourcesEntity = {
  resources: string[];
  timeSlot: TimeSlotEntity;
};

export type TimeSlotEntity = {
  from: string;
  to: string;
};

export type ScheduleEntity = {
  dates: KeyValue<string, TimeSlotEntity>[];
};

export type CapabilityEntity = {
  name: string;
  type: string;
};

export type DemandEntity = {
  capability: CapabilityEntity;
};

export type DemandsEntity = { all: DemandEntity[] };

export type DemandsPerStageEntity = {
  demands: KeyValue<string, DemandsEntity>[];
};

export type ProjectEntity = {
  id: string;
  version: number;
  name: string;
  parallelizedStages: ParallelStagesListEntity | null;
  chosenResources: ChosenResourcesEntity | null;
  schedule: ScheduleEntity | null;
  allDemands: DemandsEntity | null;
  demandsPerStage: DemandsPerStageEntity | null;
};
