CREATE TABLE IF NOT EXISTS "meal_consumption_logs" (
	"consumption_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"meal_plan_id" integer NOT NULL,
	"consumed_at" timestamp DEFAULT now() NOT NULL,
	"calories" integer NOT NULL,
	"protein" integer NOT NULL,
	"carbs" integer NOT NULL,
	"fat" integer NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meal_consumption_logs" ADD CONSTRAINT "meal_consumption_logs_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meal_consumption_logs" ADD CONSTRAINT "meal_consumption_logs_meal_plan_id_meal_plans_meal_plan_id_fk" FOREIGN KEY ("meal_plan_id") REFERENCES "public"."meal_plans"("meal_plan_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
