import { bigserial, jsonb, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import type { KeyValue } from '../../utils';

export type ResourceNameEntity = {
  name: string;
};

export type StageEntity = {
  stageName: string;
  dependencies: StageEntity[];
  resources: ResourceNameEntity[];
  duration: number;
};

export type ParallelStagesEntity = { stages: StageEntity[] };

export type ParallelStagesListEntity = {
  all: ParallelStagesEntity[];
};

export type ChosenResourcesEntity = {
  resources: ResourceNameEntity[];
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

export const projects = pgTable('projects', {
  id: uuid('project_id').primaryKey(),
  version: bigserial('version', { mode: 'number' }).notNull(),
  name: varchar('name').notNull(),
  parallelizedStages: jsonb(
    'parallelized_stages',
  ).$type<ParallelStagesListEntity>(),
  chosenResources: jsonb('chosen_resources').$type<ChosenResourcesEntity>(),
  schedule: jsonb('schedule').$type<ScheduleEntity>(),
  allDemands: jsonb('all_demands').$type<DemandsEntity>(),
  demandsPerStage: jsonb('demands_per_stage').$type<DemandsPerStageEntity>(),
});

export type ProjectEntity = typeof projects.$inferSelect;
export type NewProjectEntity = typeof projects.$inferInsert;
