CREATE TABLE IF NOT EXISTS "projects" (
	"project_id" uuid PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"name" varchar NOT NULL,
	"parallelized_stages" jsonb,
	"chosen_resources" jsonb,
	"schedule" jsonb,
	"all_demands" jsonb,
	"demands_per_stage" jsonb
);
