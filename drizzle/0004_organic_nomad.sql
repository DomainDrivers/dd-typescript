CREATE TABLE IF NOT EXISTS "devices" (
	"device_id" uuid PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"model" varchar NOT NULL,
	"capabilities" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "employees" (
	"employee_id" uuid PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"name" varchar NOT NULL,
	"seniority" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"capabilities" jsonb NOT NULL
);
