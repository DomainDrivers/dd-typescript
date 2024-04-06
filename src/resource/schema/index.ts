import { bigserial, jsonb, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

export type CapabilityEntity = {
  name: string;
  type: string;
};

export const employees = pgTable('employees', {
  id: uuid('employee_id').primaryKey(),
  version: bigserial('version', { mode: 'number' }).notNull(),
  name: varchar('name').notNull(),
  seniority: varchar('seniority').notNull(),
  last_name: varchar('last_name').notNull(),
  capabilities: jsonb('capabilities').$type<CapabilityEntity[]>().notNull(),
});

export const devices = pgTable('devices', {
  id: uuid('device_id').primaryKey(),
  version: bigserial('version', { mode: 'number' }).notNull(),
  model: varchar('model').notNull(),
  capabilities: jsonb('capabilities').$type<CapabilityEntity[]>().notNull(),
});

export type EmployeeEntity = typeof employees.$inferSelect;
export type NewEmployeeEntity = typeof employees.$inferInsert;

export type DeviceEntity = typeof devices.$inferSelect;
export type NewDeviceEntity = typeof devices.$inferInsert;
