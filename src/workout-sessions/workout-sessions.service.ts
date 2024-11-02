import { desc, eq } from "drizzle-orm";
import db from "../drizzle/db";
import { 
  WorkoutSessionsTable,
  TIWorkoutSession,
  WorkoutExercisesTable,
} from "../drizzle/schema";

type WorkoutSessionWithExercises = {
  sessionId: number;
  planId: number;
  dayNumber: number;
  name: string;
  description: string | null;
  targetMuscleGroups: string;
  duration: number;
  exercises: {
    exerciseId: number;
    sets: number;
    reps: number;
    restPeriod: number;
    order: number;
  }[];
};

export const workoutSessionService = {
  list: async (): Promise<WorkoutSessionWithExercises[]> => {
    const sessions = await db.query.WorkoutSessionsTable.findMany({
      with: {
        exercises: true,
      },
    });
    return sessions;
  },

  getById: async (id: number): Promise<WorkoutSessionWithExercises | undefined> => {
    const session = await db.query.WorkoutSessionsTable.findFirst({
      where: (sessions) => eq(sessions.sessionId, id),
      with: {
        exercises: true,
      },
    });
    return session || undefined;
  },

  getByPlanId: async (planId: number): Promise<WorkoutSessionWithExercises[]> => {
    const sessions = await db.query.WorkoutSessionsTable.findMany({
      where: (sessions) => eq(sessions.planId, planId),
      with: {
        exercises: true,
      },
    });
    return sessions;
  },

  create: async (session: TIWorkoutSession): Promise<TIWorkoutSession> => {
    const [newSession] = await db
      .insert(WorkoutSessionsTable)
      .values(session)
      .returning();
    return newSession;
  },

  update: async (id: number, session: Partial<TIWorkoutSession>): Promise<TIWorkoutSession | null> => {
    const [updatedSession] = await db
      .update(WorkoutSessionsTable)
      .set(session)
      .where(eq(WorkoutSessionsTable.sessionId, id))
      .returning();
    return updatedSession || null;
  },

  delete: async (id: number): Promise<boolean> => {
    // First delete related workout exercises
    await db
      .delete(WorkoutExercisesTable)
      .where(eq(WorkoutExercisesTable.sessionId, id));
      
    const result = await db
      .delete(WorkoutSessionsTable)
      .where(eq(WorkoutSessionsTable.sessionId, id))
      .returning();
    return result.length > 0;
  },
};