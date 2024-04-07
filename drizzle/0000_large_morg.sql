CREATE SCHEMA "allocation";
--> statement-breakpoint
CREATE SCHEMA "availability";
--> statement-breakpoint
CREATE SCHEMA "capability-scheduling";
--> statement-breakpoint
CREATE SCHEMA "cashflow";
--> statement-breakpoint
CREATE SCHEMA "planning";
--> statement-breakpoint
CREATE SCHEMA "resources";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "allocation"."allocatable_capabilities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"resource_id" uuid NOT NULL,
	"possible_capabilities" jsonb NOT NULL,
	"from_date" timestamp,
	"to_date" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "availability"."availabilities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"resource_id" uuid NOT NULL,
	"resource_parent_id" uuid,
	"version" bigint NOT NULL,
	"from_date" timestamp NOT NULL,
	"to_date" timestamp NOT NULL,
	"taken_by" uuid,
	"disabled" boolean NOT NULL,
	CONSTRAINT "availabilities_resource_id_from_date_to_date_unique" UNIQUE("resource_id","from_date","to_date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "capability-scheduling"."cap_allocatable_capabilities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"resource_id" uuid NOT NULL,
	"capability" jsonb NOT NULL,
	"from_date" timestamp NOT NULL,
	"to_date" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cashflow"."cashflows" (
	"project_allocations_id" uuid PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"cost" bigint,
	"income" bigint
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resources"."devices" (
	"device_id" uuid PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"model" varchar NOT NULL,
	"capabilities" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resources"."employees" (
	"employee_id" uuid PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"name" varchar NOT NULL,
	"seniority" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"capabilities" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "allocation"."project_allocations" (
	"project_allocations_id" uuid PRIMARY KEY NOT NULL,
	"allocations" jsonb NOT NULL,
	"demands" jsonb NOT NULL,
	"from_date" timestamp,
	"to_date" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "planning"."projects" (
	"project_id" uuid PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"name" varchar NOT NULL,
	"parallelized_stages" jsonb,
	"chosen_resources" jsonb,
	"schedule" jsonb,
	"all_demands" jsonb,
	"demands_per_stage" jsonb
);
