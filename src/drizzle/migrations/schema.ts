import { pgTable, serial, json, timestamp, foreignKey, integer, boolean, text, varchar, numeric, date, unique, pgEnum } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"

export const activityLevel = pgEnum("activity_level", ['sedentary', 'lightly_active', 'moderately_active', 'very_active'])
export const experienceLevel = pgEnum("experience_level", ['beginner', 'intermediate', 'advanced'])
export const fitnessGoal = pgEnum("fitness_goal", ['weight_loss', 'muscle_gain', 'maintenance'])
export const userRole = pgEnum("user_role", ['user', 'admin'])
export const workoutType = pgEnum("workout_type", ['home', 'gym'])



export const aiConfiguration = pgTable("ai_configuration", {
	configId: serial("config_id").primaryKey().notNull(),
	fitnessGoal: fitnessGoal("fitness_goal").notNull(),
	experienceLevel: experienceLevel("experience_level").notNull(),
	workoutType: workoutType("workout_type").notNull(),
	muscleGroupSplit: json("muscle_group_split").notNull(),
	exerciseCountRange: json("exercise_count_range").notNull(),
	restPeriodRange: json("rest_period_range").notNull(),
	setRanges: json("set_ranges").notNull(),
	repRanges: json("rep_ranges").notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const nutritionPlans = pgTable("nutrition_plans", {
	nutritionPlanId: serial("nutrition_plan_id").primaryKey().notNull(),
	userId: integer("user_id"),
	goal: fitnessGoal().notNull(),
	dailyCalories: integer("daily_calories").notNull(),
	proteinGrams: integer("protein_grams").notNull(),
	carbsGrams: integer("carbs_grams").notNull(),
	fatGrams: integer("fat_grams").notNull(),
	mealsPerDay: integer("meals_per_day").notNull(),
	isAiGenerated: boolean("is_ai_generated").default(false).notNull(),
	restrictions: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		nutritionPlansUserIdUsersUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "nutrition_plans_user_id_users_user_id_fk"
		}),
	}
});

export const mealPlans = pgTable("meal_plans", {
	mealPlanId: serial("meal_plan_id").primaryKey().notNull(),
	nutritionPlanId: integer("nutrition_plan_id").notNull(),
	dayNumber: integer("day_number").notNull(),
	mealTime: varchar("meal_time", { length: 50 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text().notNull(),
	calories: integer().notNull(),
	protein: integer().notNull(),
	carbs: integer().notNull(),
	fat: integer().notNull(),
	recipe: text(),
},
(table) => {
	return {
		mealPlansNutritionPlanIdNutritionPlansNutritionPlanId: foreignKey({
			columns: [table.nutritionPlanId],
			foreignColumns: [nutritionPlans.nutritionPlanId],
			name: "meal_plans_nutrition_plan_id_nutrition_plans_nutrition_plan_id_"
		}),
	}
});

export const exerciseLibrary = pgTable("exercise_library", {
	exerciseId: serial("exercise_id").primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text().notNull(),
	targetMuscleGroup: varchar("target_muscle_group", { length: 50 }).notNull(),
	equipment: text(),
	difficulty: experienceLevel().notNull(),
	workoutType: workoutType("workout_type").notNull(),
	videoUrl: text("video_url"),
	imageUrl: text("image_url"),
	caloriesBurnRate: numeric("calories_burn_rate"),
	instructions: text().notNull(),
});

export const exerciseLogs = pgTable("exercise_logs", {
	exerciseLogId: serial("exercise_log_id").primaryKey().notNull(),
	logId: integer("log_id").notNull(),
	exerciseId: integer("exercise_id").notNull(),
	sets: integer().notNull(),
	reps: integer().notNull(),
	weight: numeric(),
	notes: text(),
},
(table) => {
	return {
		exerciseLogsLogIdWorkoutLogsLogIdFk: foreignKey({
			columns: [table.logId],
			foreignColumns: [workoutLogs.logId],
			name: "exercise_logs_log_id_workout_logs_log_id_fk"
		}),
		exerciseLogsExerciseIdExerciseLibraryExerciseIdFk: foreignKey({
			columns: [table.exerciseId],
			foreignColumns: [exerciseLibrary.exerciseId],
			name: "exercise_logs_exercise_id_exercise_library_exercise_id_fk"
		}),
	}
});

export const aiPlansHistory = pgTable("ai_plans_history", {
	historyId: serial("history_id").primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	workoutPlanId: integer("workout_plan_id"),
	nutritionPlanId: integer("nutrition_plan_id"),
	userInputs: json("user_inputs").notNull(),
	generatedAt: timestamp("generated_at", { mode: 'string' }).defaultNow().notNull(),
	rating: integer(),
	feedback: text(),
},
(table) => {
	return {
		aiPlansHistoryUserIdUsersUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "ai_plans_history_user_id_users_user_id_fk"
		}),
		aiPlansHistoryWorkoutPlanIdWorkoutPlansPlanIdFk: foreignKey({
			columns: [table.workoutPlanId],
			foreignColumns: [workoutPlans.planId],
			name: "ai_plans_history_workout_plan_id_workout_plans_plan_id_fk"
		}),
		aiPlansHistoryNutritionPlanIdNutritionPlansNutritionPl: foreignKey({
			columns: [table.nutritionPlanId],
			foreignColumns: [nutritionPlans.nutritionPlanId],
			name: "ai_plans_history_nutrition_plan_id_nutrition_plans_nutrition_pl"
		}),
	}
});

export const progressTracking = pgTable("progress_tracking", {
	progressId: serial("progress_id").primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	date: date().notNull(),
	weight: numeric(),
	bodyFatPercentage: numeric("body_fat_percentage"),
	chest: numeric(),
	waist: numeric(),
	hips: numeric(),
	arms: numeric(),
	thighs: numeric(),
	notes: text(),
},
(table) => {
	return {
		progressTrackingUserIdUsersUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "progress_tracking_user_id_users_user_id_fk"
		}),
	}
});

export const workoutExercises = pgTable("workout_exercises", {
	workoutExerciseId: serial("workout_exercise_id").primaryKey().notNull(),
	sessionId: integer("session_id").notNull(),
	exerciseId: integer("exercise_id").notNull(),
	sets: integer().notNull(),
	reps: integer().notNull(),
	restPeriod: integer("rest_period").notNull(),
	order: integer().notNull(),
},
(table) => {
	return {
		workoutExercisesSessionIdWorkoutSessionsSessionIdFk: foreignKey({
			columns: [table.sessionId],
			foreignColumns: [workoutSessions.sessionId],
			name: "workout_exercises_session_id_workout_sessions_session_id_fk"
		}),
		workoutExercisesExerciseIdExerciseLibraryExerciseIdFk: foreignKey({
			columns: [table.exerciseId],
			foreignColumns: [exerciseLibrary.exerciseId],
			name: "workout_exercises_exercise_id_exercise_library_exercise_id_fk"
		}),
	}
});

export const users = pgTable("users", {
	userId: serial("user_id").primaryKey().notNull(),
	fullName: text("full_name").notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	dateOfBirth: date("date_of_birth").notNull(),
	gender: varchar({ length: 20 }).notNull(),
	height: numeric().notNull(),
	weight: numeric().notNull(),
	role: userRole().default('user').notNull(),
	fitnessGoal: fitnessGoal("fitness_goal").notNull(),
	experienceLevel: experienceLevel("experience_level").notNull(),
	preferredWorkoutType: workoutType("preferred_workout_type").notNull(),
	activityLevel: varchar("activity_level", { length: 50 }).notNull(),
	medicalConditions: text("medical_conditions"),
	dietaryRestrictions: text("dietary_restrictions"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		usersEmailUnique: unique("users_email_unique").on(table.email),
	}
});

export const workoutPlans = pgTable("workout_plans", {
	planId: serial("plan_id").primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	goal: fitnessGoal().notNull(),
	difficulty: experienceLevel().notNull(),
	durationWeeks: integer("duration_weeks").notNull(),
	isAiGenerated: boolean("is_ai_generated").default(false).notNull(),
	workoutType: workoutType("workout_type").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		workoutPlansUserIdUsersUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "workout_plans_user_id_users_user_id_fk"
		}),
	}
});

export const workoutLogs = pgTable("workout_logs", {
	logId: serial("log_id").primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	sessionId: integer("session_id").notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	duration: integer().notNull(),
	caloriesBurned: integer("calories_burned"),
	completed: boolean().default(true).notNull(),
	notes: text(),
},
(table) => {
	return {
		workoutLogsUserIdUsersUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "workout_logs_user_id_users_user_id_fk"
		}),
		workoutLogsSessionIdWorkoutSessionsSessionIdFk: foreignKey({
			columns: [table.sessionId],
			foreignColumns: [workoutSessions.sessionId],
			name: "workout_logs_session_id_workout_sessions_session_id_fk"
		}),
	}
});

export const workoutSessions = pgTable("workout_sessions", {
	sessionId: serial("session_id").primaryKey().notNull(),
	planId: integer("plan_id").notNull(),
	dayNumber: integer("day_number").notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	targetMuscleGroups: text("target_muscle_groups").notNull(),
	duration: integer().notNull(),
},
(table) => {
	return {
		workoutSessionsPlanIdWorkoutPlansPlanIdFk: foreignKey({
			columns: [table.planId],
			foreignColumns: [workoutPlans.planId],
			name: "workout_sessions_plan_id_workout_plans_plan_id_fk"
		}),
	}
});
