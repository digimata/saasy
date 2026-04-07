ALTER TABLE "billing"."subscriptions" ADD COLUMN IF NOT EXISTS "plan_version" integer DEFAULT 1 NOT NULL;
