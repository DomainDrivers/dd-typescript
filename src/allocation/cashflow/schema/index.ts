import { bigint, bigserial, pgSchema, uuid } from 'drizzle-orm/pg-core';

export const cashflow = pgSchema('cashflow');

export const cashflows = cashflow.table('cashflows', {
  id: uuid('project_allocations_id').primaryKey(),
  version: bigserial('version', { mode: 'number' }).notNull(),
  cost: bigint('cost', { mode: 'number' }),
  income: bigint('income', { mode: 'number' }),
});

export type CashflowEntity = typeof cashflows.$inferSelect;
export type NewCashflowEntity = typeof cashflows.$inferInsert;
