import { relations } from "drizzle-orm/relations";
import { users, nutritionPlans, mealPlans, workoutLogs, exerciseLogs, exerciseLibrary, aiPlansHistory, workoutPlans, progressTracking, workoutSessions, workoutExercises } from "./schema";

export const nutritionPlansRelations = relations(nutritionPlans, ({one, many}) => ({
	user: one(users, {
		fields: [nutritionPlans.userId],
		references: [users.userId]
	}),
	mealPlans: many(mealPlans),
	aiPlansHistories: many(aiPlansHistory),
}));

export const usersRelations = relations(users, ({many}) => ({
	nutritionPlans: many(nutritionPlans),
	aiPlansHistories: many(aiPlansHistory),
	progressTrackings: many(progressTracking),
	workoutPlans: many(workoutPlans),
	workoutLogs: many(workoutLogs),
}));

export const mealPlansRelations = relations(mealPlans, ({one}) => ({
	nutritionPlan: one(nutritionPlans, {
		fields: [mealPlans.nutritionPlanId],
		references: [nutritionPlans.nutritionPlanId]
	}),
}));

export const exerciseLogsRelations = relations(exerciseLogs, ({one}) => ({
	workoutLog: one(workoutLogs, {
		fields: [exerciseLogs.logId],
		references: [workoutLogs.logId]
	}),
	exerciseLibrary: one(exerciseLibrary, {
		fields: [exerciseLogs.exerciseId],
		references: [exerciseLibrary.exerciseId]
	}),
}));

export const workoutLogsRelations = relations(workoutLogs, ({one, many}) => ({
	exerciseLogs: many(exerciseLogs),
	user: one(users, {
		fields: [workoutLogs.userId],
		references: [users.userId]
	}),
	workoutSession: one(workoutSessions, {
		fields: [workoutLogs.sessionId],
		references: [workoutSessions.sessionId]
	}),
}));

export const exerciseLibraryRelations = relations(exerciseLibrary, ({many}) => ({
	exerciseLogs: many(exerciseLogs),
	workoutExercises: many(workoutExercises),
}));

export const aiPlansHistoryRelations = relations(aiPlansHistory, ({one}) => ({
	user: one(users, {
		fields: [aiPlansHistory.userId],
		references: [users.userId]
	}),
	workoutPlan: one(workoutPlans, {
		fields: [aiPlansHistory.workoutPlanId],
		references: [workoutPlans.planId]
	}),
	nutritionPlan: one(nutritionPlans, {
		fields: [aiPlansHistory.nutritionPlanId],
		references: [nutritionPlans.nutritionPlanId]
	}),
}));

export const workoutPlansRelations = relations(workoutPlans, ({one, many}) => ({
	aiPlansHistories: many(aiPlansHistory),
	user: one(users, {
		fields: [workoutPlans.userId],
		references: [users.userId]
	}),
	workoutSessions: many(workoutSessions),
}));

export const progressTrackingRelations = relations(progressTracking, ({one}) => ({
	user: one(users, {
		fields: [progressTracking.userId],
		references: [users.userId]
	}),
}));

export const workoutExercisesRelations = relations(workoutExercises, ({one}) => ({
	workoutSession: one(workoutSessions, {
		fields: [workoutExercises.sessionId],
		references: [workoutSessions.sessionId]
	}),
	exerciseLibrary: one(exerciseLibrary, {
		fields: [workoutExercises.exerciseId],
		references: [exerciseLibrary.exerciseId]
	}),
}));

export const workoutSessionsRelations = relations(workoutSessions, ({one, many}) => ({
	workoutExercises: many(workoutExercises),
	workoutLogs: many(workoutLogs),
	workoutPlan: one(workoutPlans, {
		fields: [workoutSessions.planId],
		references: [workoutPlans.planId]
	}),
}));