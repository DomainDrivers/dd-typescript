CREATE TABLE IF NOT EXISTS "allocatable_capabilities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"resource_id" uuid NOT NULL,
	"allocations" jsonb NOT NULL,
	"from_date" timestamp,
	"to_date" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_allocations" (
	"project_allocations_id" uuid PRIMARY KEY NOT NULL,
	"allocations" jsonb NOT NULL,
	"demands" jsonb NOT NULL,
	"from_date" timestamp,
	"to_date" timestamp
);
