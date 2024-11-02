import { desc, eq } from "drizzle-orm";
import db from "../drizzle/db";
import { 
  ExerciseLogsTable,
  WorkoutLogsTable,
  ExerciseLibraryTable,
  TIExerciseLog,
  TSExerciseLog 
} from "../drizzle/schema";

type ExerciseLogWithDetails = TSExerciseLog & {
  workoutLog: {
    date: Date;
  };
  exercise: {
    name: string;
    targetMuscleGroup: string;
  };
};

export const exerciseLogsService = {
  list: async (): Promise<ExerciseLogWithDetails[]> => {
    const logs = await db.query.ExerciseLogsTable.findMany({
      with: {
        workoutLog: {
          columns: {
            date: true
          }
        },
        exercise: {
          columns: {
            name: true,
            targetMuscleGroup: true
          }
        }
      },
      orderBy: desc(ExerciseLogsTable.exerciseLogId)
    });
    return logs;
  },

  getById: async (id: number): Promise<ExerciseLogWithDetails | undefined> => {
    const log = await db.query.ExerciseLogsTable.findFirst({
      where: (logs) => eq(logs.exerciseLogId, id),
      with: {
        workoutLog: {
          columns: {
            date: true
          }
        },
        exercise: {
          columns: {
            name: true,
            targetMuscleGroup: true
          }
        }
      }
    });
    return log || undefined;
  },

  getByLogId: async (logId: number): Promise<ExerciseLogWithDetails[]> => {
    const logs = await db.query.ExerciseLogsTable.findMany({
      where: (logs) => eq(logs.logId, logId),
      with: {
        workoutLog: {
          columns: {
            date: true
          }
        },
        exercise: {
          columns: {
            name: true,
            targetMuscleGroup: true
          }
        }
      }
    });
    return logs;
  },

  create: async (exerciseLog: TIExerciseLog): Promise<TIExerciseLog> => {
    const [newLog] = await db
      .insert(ExerciseLogsTable)
      .values(exerciseLog)
      .returning();
    return newLog;
  },

  update: async (id: number, exerciseLog: Partial<TIExerciseLog>): Promise<TIExerciseLog | null> => {
    const [updatedLog] = await db
      .update(ExerciseLogsTable)
      .set(exerciseLog)
      .where(eq(ExerciseLogsTable.exerciseLogId, id))
      .returning();
    return updatedLog || null;
  },

  delete: async (id: number): Promise<boolean> => {
    const result = await db
      .delete(ExerciseLogsTable)
      .where(eq(ExerciseLogsTable.exerciseLogId, id))
      .returning();
    return result.length > 0;
  }
};