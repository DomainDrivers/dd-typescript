CREATE SCHEMA "risk";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "risk"."project_risk_sagas" (
	"project_risk_saga_id" uuid PRIMARY KEY NOT NULL,
	"project_allocations_id" uuid NOT NULL,
	"earnings" bigint,
	"demands" jsonb,
	"deadline" timestamp,
	"version" bigint NOT NULL
);
