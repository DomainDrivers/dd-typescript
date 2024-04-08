import { bigint, jsonb, pgSchema, timestamp, uuid } from 'drizzle-orm/pg-core';

export type TimeSlotEntity = {
  from: string;
  to: string;
};

export type CapabilityEntity = {
  name: string;
  type: string;
};

export type DemandEntity = {
  capability: CapabilityEntity;
  slot: TimeSlotEntity;
};

export type DemandsEntity = { all: DemandEntity[] };

export const risk = pgSchema('risk');

export const projectRiskSagas = risk.table('project_risk_sagas', {
  id: uuid('project_risk_saga_id').primaryKey(),
  projectAllocationsId: uuid('project_allocations_id').notNull(),
  earnings: bigint('earnings', { mode: 'number' }),
  missingDemands: jsonb('demands').$type<DemandsEntity>(),
  deadline: timestamp('deadline'),
  version: bigint('version', { mode: 'number' }).notNull(),
});

export type RiskPeriodicCheckSagaEntity = typeof projectRiskSagas.$inferSelect;
export type NewRiskPeriodicCheckSagaEntity =
  typeof projectRiskSagas.$inferInsert;
