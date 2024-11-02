import { desc, eq } from "drizzle-orm";
import db from "../drizzle/db";
import { WorkoutExercisesTable, type TIWorkoutExercise } from "../drizzle/schema";

type WorkoutExerciseWithDetails = {
  workoutExerciseId: number;
  sessionId: number;
  exerciseId: number;
  sets: number;
  reps: number;
  restPeriod: number;
  order: number;
  exercise: {
    name: string;
    description: string;
    targetMuscleGroup: string;
  };
  workoutSession: {
    name: string;
    description: string | null;
  };
};

export const workoutExerciseService = {
  list: async (): Promise<WorkoutExerciseWithDetails[]> => {
    const workoutExercises = await db.query.WorkoutExercisesTable.findMany({
      with: {
        exercise: {
          columns: {
            name: true,
            description: true,
            targetMuscleGroup: true,
          },
        },
        workoutSession: {
          columns: {
            name: true,
            description: true,
          },
        },
      },
      orderBy: [WorkoutExercisesTable.sessionId, WorkoutExercisesTable.order],
    });
    return workoutExercises;
  },

  getById: async (id: number): Promise<WorkoutExerciseWithDetails | undefined> => {
    const workoutExercise = await db.query.WorkoutExercisesTable.findFirst({
      where: (workoutExercises) => eq(workoutExercises.workoutExerciseId, id),
      with: {
        exercise: {
          columns: {
            name: true,
            description: true,
            targetMuscleGroup: true,
          },
        },
        workoutSession: {
          columns: {
            name: true,
            description: true,
          },
        },
      },
    });
    return workoutExercise || undefined;
  },

  getBySessionId: async (sessionId: number): Promise<WorkoutExerciseWithDetails[]> => {
    const workoutExercises = await db.query.WorkoutExercisesTable.findMany({
      where: (workoutExercises) => eq(workoutExercises.sessionId, sessionId),
      with: {
        exercise: {
          columns: {
            name: true,
            description: true,
            targetMuscleGroup: true,
          },
        },
        workoutSession: {
          columns: {
            name: true,
            description: true,
          },
        },
      },
      orderBy: WorkoutExercisesTable.order,
    });
    return workoutExercises;
  },

  create: async (workoutExercise: TIWorkoutExercise): Promise<TIWorkoutExercise> => {
    const [newWorkoutExercise] = await db
      .insert(WorkoutExercisesTable)
      .values(workoutExercise)
      .returning();
    return newWorkoutExercise;
  },

  update: async (id: number, workoutExercise: Partial<TIWorkoutExercise>): Promise<TIWorkoutExercise | null> => {
    const [updatedWorkoutExercise] = await db
      .update(WorkoutExercisesTable)
      .set(workoutExercise)
      .where(eq(WorkoutExercisesTable.workoutExerciseId, id))
      .returning();
    return updatedWorkoutExercise || null;
  },

  delete: async (id: number): Promise<boolean> => {
    const result = await db
      .delete(WorkoutExercisesTable)
      .where(eq(WorkoutExercisesTable.workoutExerciseId, id))
      .returning();
    return result.length > 0;
  },
};