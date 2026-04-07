CREATE TABLE "billing"."usage" (
	"workspace_id" uuid NOT NULL,
	"feature" text NOT NULL,
	"val" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp with time zone,
	CONSTRAINT "usage_workspace_id_feature_pk" PRIMARY KEY("workspace_id","feature")
);
--> statement-breakpoint
ALTER TABLE "billing"."usage" ADD CONSTRAINT "usage_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "auth"."workspaces"("id") ON DELETE cascade ON UPDATE no action;