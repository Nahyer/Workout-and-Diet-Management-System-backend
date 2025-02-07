import {
    pgTable,
    serial,
    text,
    varchar,
    integer,
    timestamp,
    boolean,
    pgEnum,
    primaryKey,
    decimal,
    date,
    json,
  } from "drizzle-orm/pg-core";
  import { relations } from "drizzle-orm";
  
  // Enums
  export const userRoleEnum = pgEnum("user_role", ["user", "admin"]); 
  export const fitnessGoalEnum = pgEnum("fitness_goal", ["weight_loss", "muscle_gain", "maintenance"]);
  export const experienceLevelEnum = pgEnum("experience_level", ["beginner", "intermediate", "advanced"]);
  export const workoutTypeEnum = pgEnum("workout_type", ["home", "gym"]);
  export const activityLevelEnum = pgEnum("activity_level", ["sedentary", "lightly_active", "moderately_active", "very_active"]);
  
  // Users Table - Stores user profile and fitness preferences
  export const UsersTable = pgTable("users", {
    userId: serial("user_id").primaryKey(),
    fullName: text("full_name").notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    dateOfBirth: date("date_of_birth").notNull(),
    gender: varchar("gender", { length: 20 }).notNull(),
    height: decimal("height").notNull(), // in cm
    weight: decimal("weight").notNull(), // in kg
    role: userRoleEnum("role").default("user").notNull(),
    fitnessGoal: fitnessGoalEnum("fitness_goal").notNull(),
    experienceLevel: experienceLevelEnum("experience_level").notNull(),
    preferredWorkoutType: workoutTypeEnum("preferred_workout_type").notNull(),
    activityLevel: varchar("activity_level", { length: 50 }).notNull(), // sedentary, lightly active, moderately active, very active
    medicalConditions: text("medical_conditions"),
    dietaryRestrictions: text("dietary_restrictions"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  });
  
  // Exercise Library Table - Database of all available exercises
  export const ExerciseLibraryTable = pgTable("exercise_library", {
    exerciseId: serial("exercise_id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description").notNull(),
    targetMuscleGroup: varchar("target_muscle_group", { length: 50 }).notNull(),
    equipment: text("equipment"),
    difficulty: experienceLevelEnum("difficulty").notNull(),
    workoutType: workoutTypeEnum("workout_type").notNull(),
    videoUrl: text("video_url"), // Tutorial videos for proper form
    imageUrl: text("image_url"), // Exercise demonstration images
    caloriesBurnRate: decimal("calories_burn_rate"), // Estimated calories burned per minute
    instructions: text("instructions").notNull(), // Step-by-step instructions
  });

  // Workout Plans Table
export const WorkoutPlansTable = pgTable("workout_plans", {
    planId: serial("plan_id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => UsersTable.userId),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    goal: fitnessGoalEnum("goal").notNull(),
    difficulty: experienceLevelEnum("difficulty").notNull(),
    durationWeeks: integer("duration_weeks").notNull(),
    isAiGenerated: boolean("is_ai_generated").default(false).notNull(),
    workoutType: workoutTypeEnum("workout_type").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  });
  
  // Workout Sessions Table
  export const WorkoutSessionsTable = pgTable("workout_sessions", {
    sessionId: serial("session_id").primaryKey(),
    planId: integer("plan_id")
      .notNull()
      .references(() => WorkoutPlansTable.planId),
    dayNumber: integer("day_number").notNull(), // 1-6 for 6-day routine
    name: varchar("name", { length: 100 }).notNull(), // e.g., "Upper Body Day"
    description: text("description"),
    targetMuscleGroups: text("target_muscle_groups").notNull(),
    duration: integer("duration").notNull(), // in minutes
  });
  
  // Workout Exercises Table (Junction table between Sessions and Exercises)
  export const WorkoutExercisesTable = pgTable("workout_exercises", {
    workoutExerciseId: serial("workout_exercise_id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => WorkoutSessionsTable.sessionId),
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => ExerciseLibraryTable.exerciseId),
    sets: integer("sets").notNull(),
    reps: integer("reps").notNull(),
    restPeriod: integer("rest_period").notNull(), // in seconds
    order: integer("order").notNull(),
  });
  
  // Nutrition Plans Table
  export const NutritionPlansTable = pgTable("nutrition_plans", {
    nutritionPlanId: serial("nutrition_plan_id").primaryKey(),
    userId: integer("user_id")
      .references(() => UsersTable.userId),
    goal: fitnessGoalEnum("goal").notNull(),
    dailyCalories: integer("daily_calories").notNull(),
    proteinGrams: integer("protein_grams").notNull(),
    carbsGrams: integer("carbs_grams").notNull(),
    fatGrams: integer("fat_grams").notNull(),
    mealsPerDay: integer("meals_per_day").notNull(),
    isAiGenerated: boolean("is_ai_generated").default(false).notNull(),
    restrictions: text("restrictions"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  });
  
  // Meal Plans Table
  export const MealPlansTable = pgTable("meal_plans", {
    mealPlanId: serial("meal_plan_id").primaryKey(),
    nutritionPlanId: integer("nutrition_plan_id")
      .notNull()
      .references(() => NutritionPlansTable.nutritionPlanId),
    dayNumber: integer("day_number").notNull(), // 1-7 for weekly plan
    mealTime: varchar("meal_time", { length: 50 }).notNull(), // breakfast, lunch, dinner, snack
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description").notNull(),
    calories: integer("calories").notNull(),
    protein: integer("protein").notNull(),
    carbs: integer("carbs").notNull(),
    fat: integer("fat").notNull(),
    recipe: text("recipe"),
  });
  
  // Progress Tracking Table
  export const ProgressTrackingTable = pgTable("progress_tracking", {
    progressId: serial("progress_id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => UsersTable.userId),
    date: date("date").notNull(),
    weight: decimal("weight"), // in kg
    bodyFatPercentage: decimal("body_fat_percentage"),
    chest: decimal("chest"), // measurements in cm
    waist: decimal("waist"),
    hips: decimal("hips"),
    arms: decimal("arms"),
    thighs: decimal("thighs"),
    notes: text("notes"),
  });
  
  // Workout Logs Table
  export const WorkoutLogsTable = pgTable("workout_logs", {
    logId: serial("log_id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => UsersTable.userId),
    sessionId: integer("session_id")
      .notNull()
      .references(() => WorkoutSessionsTable.sessionId),
    date: timestamp("date").notNull(),
    duration: integer("duration").notNull(), // in minutes
    caloriesBurned: integer("calories_burned"),
    completed: boolean("completed").notNull().default(true),
    notes: text("notes"),
  });
  
  // Exercise Logs Table
  export const ExerciseLogsTable = pgTable("exercise_logs", {
    exerciseLogId: serial("exercise_log_id").primaryKey(),
    logId: integer("log_id")
      .notNull()
      .references(() => WorkoutLogsTable.logId),
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => ExerciseLibraryTable.exerciseId),
    sets: integer("sets").notNull(),
    reps: integer("reps").notNull(),
    weight: decimal("weight"), // in kg
    notes: text("notes"),
  });
  
  // AI Generated Plans History Table
  export const AiPlansHistoryTable = pgTable("ai_plans_history", {
    historyId: serial("history_id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => UsersTable.userId),
    workoutPlanId: integer("workout_plan_id")
      .references(() => WorkoutPlansTable.planId),
    nutritionPlanId: integer("nutrition_plan_id")
      .references(() => NutritionPlansTable.nutritionPlanId),
    userInputs: json("user_inputs").notNull(), // Store user inputs used for generation
    generatedAt: timestamp("generated_at").notNull().defaultNow(),
    rating: integer("rating"), // User rating of the generated plan
    feedback: text("feedback"),
  });
  
  
  // AI Configuration Table - Stores parameters for AI plan generation
  export const AiConfigurationTable = pgTable("ai_configuration", {
    configId: serial("config_id").primaryKey(),
    fitnessGoal: fitnessGoalEnum("fitness_goal").notNull(),
    experienceLevel: experienceLevelEnum("experience_level").notNull(),
    workoutType: workoutTypeEnum("workout_type").notNull(),
    muscleGroupSplit: json("muscle_group_split").notNull(), // How to split muscle groups across 6 days
    exerciseCountRange: json("exercise_count_range").notNull(), // Min/max exercises per session
    restPeriodRange: json("rest_period_range").notNull(), // Min/max rest periods
    setRanges: json("set_ranges").notNull(), // Recommended set ranges by experience
    repRanges: json("rep_ranges").notNull(), // Recommended rep ranges by goal
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  });
  

  // Relations
export const usersRelations = relations(UsersTable, ({ many }) => ({
  workoutPlans: many(WorkoutPlansTable),
  nutritionPlans: many(NutritionPlansTable),
  progressTracking: many(ProgressTrackingTable),
  workoutLogs: many(WorkoutLogsTable),
  aiPlansHistory: many(AiPlansHistoryTable),
}));

export const progressTrackingRelations = relations(ProgressTrackingTable, ({ one }) => ({
  user: one(UsersTable, {
    fields: [ProgressTrackingTable.userId],
    references: [UsersTable.userId],
  }),
}));

export const workoutPlansRelations = relations(WorkoutPlansTable, ({ many, one }) => ({
  sessions: many(WorkoutSessionsTable),
  user: one(UsersTable, {
    fields: [WorkoutPlansTable.userId],
    references: [UsersTable.userId],
  }),
}));

export const nutritionPlansRelations = relations(NutritionPlansTable, ({ many, one }) => ({
  mealPlans: many(MealPlansTable),
  user: one(UsersTable, {
    fields: [NutritionPlansTable.userId],
    references: [UsersTable.userId],
  }),
}));

export const workoutLogsRelations = relations(WorkoutLogsTable, ({ one, many }) => ({
  user: one(UsersTable, {
    fields: [WorkoutLogsTable.userId],
    references: [UsersTable.userId],
  }),
  session: one(WorkoutSessionsTable, {
    fields: [WorkoutLogsTable.sessionId],
    references: [WorkoutSessionsTable.sessionId],
  }),
  exerciseLogs: many(ExerciseLogsTable)
}));

export const aiPlansHistoryRelations = relations(AiPlansHistoryTable, ({ one }) => ({
  user: one(UsersTable, {
    fields: [AiPlansHistoryTable.userId],
    references: [UsersTable.userId],
  }),
  workoutPlan: one(WorkoutPlansTable, {
    fields: [AiPlansHistoryTable.workoutPlanId],
    references: [WorkoutPlansTable.planId],
  }),
  nutritionPlan: one(NutritionPlansTable, {
    fields: [AiPlansHistoryTable.nutritionPlanId],
    references: [NutritionPlansTable.nutritionPlanId],
  }),
}));


// Exercise Library Relations
export const exerciseLibraryRelations = relations(ExerciseLibraryTable, ({ many }) => ({
  workoutExercises: many(WorkoutExercisesTable),
  exerciseLogs: many(ExerciseLogsTable),
}));

// Workout Exercises Relations
export const workoutExercisesRelations = relations(WorkoutExercisesTable, ({ one }) => ({
  exercise: one(ExerciseLibraryTable, {
    fields: [WorkoutExercisesTable.exerciseId],
    references: [ExerciseLibraryTable.exerciseId],
  }),
  workoutSession: one(WorkoutSessionsTable, {
    fields: [WorkoutExercisesTable.sessionId],
    references: [WorkoutSessionsTable.sessionId],
  }),
}));

// Exercise Logs Relations
export const exerciseLogsRelations = relations(ExerciseLogsTable, ({ one }) => ({
  exercise: one(ExerciseLibraryTable, {
    fields: [ExerciseLogsTable.exerciseId],
    references: [ExerciseLibraryTable.exerciseId],
  }),
  workoutLog: one(WorkoutLogsTable, {
    fields: [ExerciseLogsTable.logId],
    references: [WorkoutLogsTable.logId],
  }),
}));

export const workoutSessionsRelations = relations(WorkoutSessionsTable, ({ one, many }) => ({
  workoutPlan: one(WorkoutPlansTable, {
    fields: [WorkoutSessionsTable.planId],
    references: [WorkoutPlansTable.planId],
  }),
  exercises: many(WorkoutExercisesTable),
  workoutLogs: many(WorkoutLogsTable)
}));

export const mealPlansRelations = relations(MealPlansTable, ({ one }) => ({
  nutritionPlan: one(NutritionPlansTable, {
    fields: [MealPlansTable.nutritionPlanId],
    references: [NutritionPlansTable.nutritionPlanId],
  }),
}));
  
  // Types
  export type TIUser = typeof UsersTable.$inferInsert;
  export type TSUser = typeof UsersTable.$inferSelect;
  
  export type TIExerciseLibrary = typeof ExerciseLibraryTable.$inferInsert;
  export type TSExerciseLibrary = typeof ExerciseLibraryTable.$inferSelect;
  
  export type TIWorkoutPlan = typeof WorkoutPlansTable.$inferInsert;
  export type TSWorkoutPlan = typeof WorkoutPlansTable.$inferSelect;
  
  export type TIWorkoutSession = typeof WorkoutSessionsTable.$inferInsert;
  export type TSWorkoutSession = typeof WorkoutSessionsTable.$inferSelect;
  
  export type TINutritionPlan = typeof NutritionPlansTable.$inferInsert;
  export type TSNutritionPlan = typeof NutritionPlansTable.$inferSelect;
  
  export type TIMealPlan = typeof MealPlansTable.$inferInsert;
  export type TSMealPlan = typeof MealPlansTable.$inferSelect;
  
  export type TIProgressTracking = typeof ProgressTrackingTable.$inferInsert;
  export type TSProgressTracking = typeof ProgressTrackingTable.$inferSelect;
  
  export type TIWorkoutLog = typeof WorkoutLogsTable.$inferInsert;
  export type TSWorkoutLog = typeof WorkoutLogsTable.$inferSelect;
  
  export type TIExerciseLog = typeof ExerciseLogsTable.$inferInsert;
  export type TSExerciseLog = typeof ExerciseLogsTable.$inferSelect;
  
  export type TIAiPlansHistory = typeof AiPlansHistoryTable.$inferInsert;
  export type TSAiPlansHistory = typeof AiPlansHistoryTable.$inferSelect;

  export type TIAiConfiguration = typeof AiConfigurationTable.$inferInsert;
  export type TSAiConfiguration = typeof AiConfigurationTable.$inferSelect;

  export type TIWorkoutExercise = typeof WorkoutExercisesTable.$inferInsert;
  export type TSWorkoutExercise = typeof WorkoutExercisesTable.$inferSelect;
  