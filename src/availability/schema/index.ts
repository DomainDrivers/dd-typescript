import {
  bigint,
  boolean,
  pgSchema,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

export const availability = pgSchema('availability');

export const availabilities = availability.table(
  'availabilities',
  {
    id: uuid('id').primaryKey(),
    resource_id: uuid('resource_id').notNull(),
    resource_parent_id: uuid('resource_parent_id'),
    version: bigint('version', { mode: 'number' }).notNull(),
    from_date: timestamp('from_date').notNull(),
    to_date: timestamp('to_date').notNull(),
    taken_by: uuid('taken_by'),
    disabled: boolean('disabled').notNull(),
  },
  (t) => ({ unq: unique().on(t.resource_id, t.from_date, t.to_date) }),
);
