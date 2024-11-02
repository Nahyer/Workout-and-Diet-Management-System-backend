import { desc, eq, SQL } from "drizzle-orm";
import db from "../drizzle/db";
import { 
  ExerciseLibraryTable, 
  WorkoutExercisesTable, 
  ExerciseLogsTable, 
  TIExerciseLibrary,
  WorkoutSessionsTable,
  TSExerciseLog,
  WorkoutLogsTable
} from "../drizzle/schema";

// Define relation types
type WorkoutExerciseRelation = {
  sets: number;
  reps: number;
  restPeriod: number;
  workoutSession: {
    name: string;
    description: string | null;
  };
};

type ExerciseLogRelation = {
  date: Date;
  sets: number;
  reps: number;
  weight: string | null;
  notes: string | null;
};

type ExerciseWithDetails = {
  exerciseId: number;
  name: string;
  description: string;
  targetMuscleGroup: string;
  equipment: string | null;
  difficulty: string;
  workoutType: string;
  videoUrl: string | null;
  imageUrl: string | null;
  caloriesBurnRate: string | null;
  instructions: string;
  workoutExercises: WorkoutExerciseRelation[];
  exerciseLogs: ExerciseLogRelation[];
};

// Define raw query result type to match database structure
type RawExerciseQueryResult = {
  exerciseId: number;
  name: string;
  description: string;
  targetMuscleGroup: string;
  equipment: string | null;
  difficulty: string;
  workoutType: string;
  videoUrl: string | null;
  imageUrl: string | null;
  caloriesBurnRate: string | null;
  instructions: string;
  workoutExercises: {
    sets: number;
    reps: number;
    restPeriod: number;
    workoutSession: {
      name: string;
      description: string | null;
    };
  }[];
  exerciseLogs: {
    logId: number;
    exerciseLogId: number;
    exerciseId: number;
    date: string;
    sets: number;
    reps: number;
    weight: string | null;
    notes: string | null;
  }[];
};

export const exerciseLibraryService = {
  list: async (): Promise<ExerciseWithDetails[]> => {
    const exercises = await db.query.ExerciseLibraryTable.findMany({
      with: {
        workoutExercises: {
          with: {
            workoutSession: {
              columns: {
                name: true,
                description: true,
              },
            },
          },
        },
        exerciseLogs: {
          with: {
            workoutLog: {
              columns: {
                date: true,
              },
            },
          },
          orderBy: desc(ExerciseLogsTable.exerciseLogId),
          limit: 5,
        },
      },
    }) as unknown as RawExerciseQueryResult[];

    return exercises.map((exercise) => ({
      ...exercise,
      workoutExercises: exercise.workoutExercises.map((we) => ({
        sets: we.sets,
        reps: we.reps,
        restPeriod: we.restPeriod,
        workoutSession: we.workoutSession,
      })),
      exerciseLogs: exercise.exerciseLogs.map((log) => ({
        date: new Date(log.date),
        sets: log.sets,
        reps: log.reps,
        weight: log.weight,
        notes: log.notes,
      })),
    }));
  },

  getById: async (id: number): Promise<ExerciseWithDetails | undefined> => {
    const exercise = await db.query.ExerciseLibraryTable.findFirst({
      where: (exercises) => eq(exercises.exerciseId, id),
      with: {
        workoutExercises: {
          with: {
            workoutSession: {
              columns: {
                name: true,
                description: true,
              },
            },
          },
        },
        exerciseLogs: {
          with: {
            workoutLog: {
              columns: {
                date: true,
              },
            },
          },
          orderBy: desc(ExerciseLogsTable.exerciseLogId),
          limit: 10,
        },
      },
    }) as unknown as RawExerciseQueryResult | undefined;

    if (!exercise) return undefined;

    return {
      ...exercise,
      workoutExercises: exercise.workoutExercises.map((we) => ({
        sets: we.sets,
        reps: we.reps,
        restPeriod: we.restPeriod,
        workoutSession: we.workoutSession,
      })),
      exerciseLogs: exercise.exerciseLogs.map((log) => ({
        date: new Date(log.date),
        sets: log.sets,
        reps: log.reps,
        weight: log.weight,
        notes: log.notes,
      })),
    };
  },

  create: async (exercise: TIExerciseLibrary): Promise<TIExerciseLibrary> => {
    const [newExercise] = await db
      .insert(ExerciseLibraryTable)
      .values(exercise)
      .returning();
    return newExercise;
  },

  update: async (id: number, exercise: Partial<TIExerciseLibrary>): Promise<TIExerciseLibrary | null> => {
    const [updatedExercise] = await db
      .update(ExerciseLibraryTable)
      .set(exercise)
      .where(eq(ExerciseLibraryTable.exerciseId, id))
      .returning();
    return updatedExercise || null;
  },

  delete: async (id: number): Promise<boolean> => {
    const result = await db
      .delete(ExerciseLibraryTable)
      .where(eq(ExerciseLibraryTable.exerciseId, id))
      .returning();
    return result.length > 0;
  },
};