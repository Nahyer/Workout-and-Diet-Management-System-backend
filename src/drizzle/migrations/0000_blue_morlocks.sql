CREATE TYPE "public"."experience_level" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."fitness_goal" AS ENUM('weight_loss', 'muscle_gain', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."workout_type" AS ENUM('home', 'gym');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_configuration" (
	"config_id" serial PRIMARY KEY NOT NULL,
	"fitness_goal" "fitness_goal" NOT NULL,
	"experience_level" "experience_level" NOT NULL,
	"workout_type" "workout_type" NOT NULL,
	"muscle_group_split" json NOT NULL,
	"exercise_count_range" json NOT NULL,
	"rest_period_range" json NOT NULL,
	"set_ranges" json NOT NULL,
	"rep_ranges" json NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_plans_history" (
	"history_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"workout_plan_id" integer,
	"nutrition_plan_id" integer,
	"user_inputs" json NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"rating" integer,
	"feedback" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exercise_library" (
	"exercise_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"target_muscle_group" varchar(50) NOT NULL,
	"equipment" text,
	"difficulty" "experience_level" NOT NULL,
	"workout_type" "workout_type" NOT NULL,
	"video_url" text,
	"image_url" text,
	"calories_burn_rate" numeric,
	"instructions" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exercise_logs" (
	"exercise_log_id" serial PRIMARY KEY NOT NULL,
	"log_id" integer NOT NULL,
	"exercise_id" integer NOT NULL,
	"sets" integer NOT NULL,
	"reps" integer NOT NULL,
	"weight" numeric,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meal_plans" (
	"meal_plan_id" serial PRIMARY KEY NOT NULL,
	"nutrition_plan_id" integer NOT NULL,
	"day_number" integer NOT NULL,
	"meal_time" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"calories" integer NOT NULL,
	"protein" integer NOT NULL,
	"carbs" integer NOT NULL,
	"fat" integer NOT NULL,
	"recipe" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nutrition_plans" (
	"nutrition_plan_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"goal" "fitness_goal" NOT NULL,
	"daily_calories" integer NOT NULL,
	"protein_grams" integer NOT NULL,
	"carbs_grams" integer NOT NULL,
	"fat_grams" integer NOT NULL,
	"meals_per_day" integer NOT NULL,
	"is_ai_generated" boolean DEFAULT false NOT NULL,
	"restrictions" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "progress_tracking" (
	"progress_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" date NOT NULL,
	"weight" numeric,
	"body_fat_percentage" numeric,
	"chest" numeric,
	"waist" numeric,
	"hips" numeric,
	"arms" numeric,
	"thighs" numeric,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"date_of_birth" date NOT NULL,
	"gender" varchar(20) NOT NULL,
	"height" numeric NOT NULL,
	"weight" numeric NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"fitness_goal" "fitness_goal" NOT NULL,
	"experience_level" "experience_level" NOT NULL,
	"preferred_workout_type" "workout_type" NOT NULL,
	"activity_level" varchar(50) NOT NULL,
	"medical_conditions" text,
	"dietary_restrictions" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workout_exercises" (
	"workout_exercise_id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"exercise_id" integer NOT NULL,
	"sets" integer NOT NULL,
	"reps" integer NOT NULL,
	"rest_period" integer NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workout_logs" (
	"log_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"calories_burned" integer,
	"completed" boolean DEFAULT true NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workout_plans" (
	"plan_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"goal" "fitness_goal" NOT NULL,
	"difficulty" "experience_level" NOT NULL,
	"duration_weeks" integer NOT NULL,
	"is_ai_generated" boolean DEFAULT false NOT NULL,
	"workout_type" "workout_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workout_sessions" (
	"session_id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"day_number" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"target_muscle_groups" text NOT NULL,
	"duration" integer NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_plans_history" ADD CONSTRAINT "ai_plans_history_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_plans_history" ADD CONSTRAINT "ai_plans_history_workout_plan_id_workout_plans_plan_id_fk" FOREIGN KEY ("workout_plan_id") REFERENCES "public"."workout_plans"("plan_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_plans_history" ADD CONSTRAINT "ai_plans_history_nutrition_plan_id_nutrition_plans_nutrition_plan_id_fk" FOREIGN KEY ("nutrition_plan_id") REFERENCES "public"."nutrition_plans"("nutrition_plan_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_log_id_workout_logs_log_id_fk" FOREIGN KEY ("log_id") REFERENCES "public"."workout_logs"("log_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_exercise_id_exercise_library_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise_library"("exercise_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_nutrition_plan_id_nutrition_plans_nutrition_plan_id_fk" FOREIGN KEY ("nutrition_plan_id") REFERENCES "public"."nutrition_plans"("nutrition_plan_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nutrition_plans" ADD CONSTRAINT "nutrition_plans_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "progress_tracking" ADD CONSTRAINT "progress_tracking_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_session_id_workout_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("session_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_exercise_id_exercise_library_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise_library"("exercise_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_session_id_workout_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("session_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_plan_id_workout_plans_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."workout_plans"("plan_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
