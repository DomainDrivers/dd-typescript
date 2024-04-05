CREATE TABLE IF NOT EXISTS "cashflows" (
	"project_allocations_id" uuid PRIMARY KEY NOT NULL,
	"version" bigserial NOT NULL,
	"cost" bigint,
	"income" bigint
);
