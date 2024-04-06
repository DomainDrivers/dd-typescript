CREATE TABLE IF NOT EXISTS "availabilities" (
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
