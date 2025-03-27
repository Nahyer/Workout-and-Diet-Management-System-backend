ALTER TABLE "users" ADD COLUMN "last_login" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "login_streak" integer DEFAULT 0;