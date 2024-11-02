import db from "../drizzle/db";
import { 
  WorkoutPlansTable, 
  TIWorkoutPlan, 
  TSWorkoutPlan,
  WorkoutSessionsTable,
  TSWorkoutSession,
  UsersTable,
  TSUser,
  WorkoutExercisesTable,
  ExerciseLibraryTable,
  TSExerciseLibrary
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const workoutPlanService = {
  list: async (userId: number) => {
    return await db.query.WorkoutPlansTable.findMany({
      where: (plans) => eq(plans.userId, userId),
      with: {
        sessions: {
          with: {
            exercises: {
              with: {
                exercise: true
              }
            }
          }
        }
      }
    });
  },

  getById: async (id: number) => {
    return await db.query.WorkoutPlansTable.findFirst({
      where: (plans) => eq(plans.planId, id),
      with: {
        sessions: {
          with: {
            exercises: {
              with: {
                exercise: true
              }
            }
          }
        },
        user: {
          columns: {
            userId: true,
            fullName: true
          }
        }
      }
    });
  },

  create: async (plan: TIWorkoutPlan): Promise<TIWorkoutPlan> => {
    const [newPlan] = await db
      .insert(WorkoutPlansTable)
      .values(plan)
      .returning();
    return newPlan;
  },

  update: async (id: number, plan: Partial<TIWorkoutPlan>): Promise<TIWorkoutPlan | null> => {
    const [updatedPlan] = await db
      .update(WorkoutPlansTable)
      .set(plan)
      .where(eq(WorkoutPlansTable.planId, id))
      .returning();
    return updatedPlan || null;
  },

  delete: async (id: number): Promise<boolean> => {
    const result = await db
      .delete(WorkoutPlansTable)
      .where(eq(WorkoutPlansTable.planId, id))
      .returning();
    return result.length > 0;
  }
};