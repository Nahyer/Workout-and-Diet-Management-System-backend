import { desc, eq } from "drizzle-orm";
import db from "../drizzle/db";
import { WorkoutLogsTable, TIWorkoutLog, TSWorkoutLog } from "../drizzle/schema";

type WorkoutLogWithDetails = TSWorkoutLog & {
  user?: {
    fullName: string;
  };
  session?: {
    name: string;
    description: string | null;
  };
};

export const workoutLogsService = {
  list: async (): Promise<WorkoutLogWithDetails[]> => {
    return await db.query.WorkoutLogsTable.findMany({
      with: {
        user: {
          columns: {
            fullName: true,
          },
        },
        session: {
          columns: {
            name: true,
            description: true,
          },
        },
      },
      orderBy: desc(WorkoutLogsTable.date),
    });
  },

  getById: async (id: number): Promise<WorkoutLogWithDetails | undefined> => {
    const log = await db.query.WorkoutLogsTable.findFirst({
      where: (logs) => eq(logs.logId, id),
      with: {
        user: {
          columns: {
            fullName: true,
          },
        },
        session: {
          columns: {
            name: true,
            description: true,
          },
        },
      },
    });
    return log || undefined;
  },

  getByUserId: async (userId: number): Promise<WorkoutLogWithDetails[]> => {
    return await db.query.WorkoutLogsTable.findMany({
      where: (logs) => eq(logs.userId, userId),
      with: {
        user: {
          columns: {
            fullName: true,
          },
        },
        session: {
          columns: {
            name: true,
            description: true,
          },
        },
      },
      orderBy: desc(WorkoutLogsTable.date),
    });
  },

  create: async (workoutLog: TIWorkoutLog): Promise<TIWorkoutLog> => {
    // Ensure the date is properly handled
    const logData = {
      ...workoutLog,
      date: workoutLog.date instanceof Date ? workoutLog.date : new Date(workoutLog.date),
    };

    const [newLog] = await db
      .insert(WorkoutLogsTable)
      .values(logData)
      .returning();
    return newLog;
  },

  update: async (id: number, workoutLog: Partial<TIWorkoutLog>): Promise<TIWorkoutLog | null> => {
    // Handle date conversion if date is provided
    const logData = workoutLog.date
      ? {
          ...workoutLog,
          date: workoutLog.date instanceof Date ? workoutLog.date : new Date(workoutLog.date),
        }
      : workoutLog;

    const [updatedLog] = await db
      .update(WorkoutLogsTable)
      .set(logData)
      .where(eq(WorkoutLogsTable.logId, id))
      .returning();
    return updatedLog || null;
  },

  delete: async (id: number): Promise<boolean> => {
    const result = await db
      .delete(WorkoutLogsTable)
      .where(eq(WorkoutLogsTable.logId, id))
      .returning();
    return result.length > 0;
  },
};