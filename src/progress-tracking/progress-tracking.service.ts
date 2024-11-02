import { desc, eq } from "drizzle-orm";
import db from "../drizzle/db";
import { 
  ProgressTrackingTable,
  TIProgressTracking,
  TSProgressTracking
} from "../drizzle/schema";

type ProgressWithUser = TSProgressTracking & {
  user: {
    fullName: string;
    email: string;
  };
};

export const progressTrackingService = {
  list: async (): Promise<ProgressWithUser[]> => {
    return await db.query.ProgressTrackingTable.findMany({
      with: {
        user: {
          columns: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: [desc(ProgressTrackingTable.date)],
    });
  },

  getById: async (id: number): Promise<ProgressWithUser | undefined> => {
    return await db.query.ProgressTrackingTable.findFirst({
      where: (progress) => eq(progress.progressId, id),
      with: {
        user: {
          columns: {
            fullName: true,
            email: true,
          },
        },
      },
    });
  },

  getByUserId: async (userId: number): Promise<ProgressWithUser[]> => {
    return await db.query.ProgressTrackingTable.findMany({
      where: (progress) => eq(progress.userId, userId),
      with: {
        user: {
          columns: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: [desc(ProgressTrackingTable.date)],
    });
  },

  create: async (progress: TIProgressTracking): Promise<TIProgressTracking> => {
    const [newProgress] = await db
      .insert(ProgressTrackingTable)
      .values(progress)
      .returning();
    return newProgress;
  },

  update: async (id: number, progress: Partial<TIProgressTracking>): Promise<TIProgressTracking | null> => {
    const [updatedProgress] = await db
      .update(ProgressTrackingTable)
      .set(progress)
      .where(eq(ProgressTrackingTable.progressId, id))
      .returning();
    return updatedProgress || null;
  },

  delete: async (id: number): Promise<boolean> => {
    const result = await db
      .delete(ProgressTrackingTable)
      .where(eq(ProgressTrackingTable.progressId, id))
      .returning();
    return result.length > 0;
  },
};
