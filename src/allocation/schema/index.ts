import { jsonb, pgSchema, timestamp, uuid } from 'drizzle-orm/pg-core';

export type TimeSlotEntity = {
  from: string;
  to: string;
};

export type CapabilityEntity = {
  name: string;
  type: string;
};

export type AllocatedCapabilityEntity = {
  allocatedCapabilityID: string;
  resourceId: string;
  capability: CapabilityEntity;
  timeSlot: TimeSlotEntity;
};

export type AllocationsEntity = { all: AllocatedCapabilityEntity[] };

export type DemandEntity = {
  capability: CapabilityEntity;
  slot: TimeSlotEntity;
};

export type DemandsEntity = { all: DemandEntity[] };

export const allocation = pgSchema('allocation');

export const projectAllocations = allocation.table('project_allocations', {
  id: uuid('project_allocations_id').primaryKey(),
  allocations: jsonb('allocations').$type<AllocationsEntity>().notNull(),
  demands: jsonb('demands').$type<DemandsEntity>().notNull(),
  fromDate: timestamp('from_date'),
  toDate: timestamp('to_date'),
});

export const allocatableCapabilities = allocation.table(
  'allocatable_capabilities',
  {
    id: uuid('id').primaryKey(),
    resource_id: uuid('resource_id').notNull(),
    possible_capabilities: jsonb('possible_capabilities')
      .$type<CapabilityEntity>()
      .notNull(),
    fromDate: timestamp('from_date'),
    toDate: timestamp('to_date'),
  },
);

export type ProjectAllocationsEntity = typeof projectAllocations.$inferSelect;
export type NewProjectAllocationsEntity =
  typeof projectAllocations.$inferInsert;

export type AllocatableCapabilitiesEntity =
  typeof allocatableCapabilities.$inferSelect;
export type NewAllocatableCapabilitiesEntity =
  typeof allocatableCapabilities.$inferInsert;
