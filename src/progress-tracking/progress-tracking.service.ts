import { desc, eq, gte, lte, and } from "drizzle-orm";
import db from "../drizzle/db";
import { ProgressTrackingTable, TIProgressTracking, TSProgressTracking } from "../drizzle/schema";

type QueryOptions = {
  limit?: number;
  startDate?: Date;
  endDate?: Date;
};

export const progressTrackingService = {
  list: async (): Promise<TSProgressTracking[]> => {
    return await db.query.ProgressTrackingTable.findMany({
      orderBy: [desc(ProgressTrackingTable.date)],
    });
  },

  getById: async (id: number): Promise<TSProgressTracking | undefined> => {
    return await db.query.ProgressTrackingTable.findFirst({
      where: eq(ProgressTrackingTable.progressId, id),
    });
  },

  getByUserId: async (userId: number, options: QueryOptions = {}): Promise<any[]> => {
    const { limit = 30, startDate, endDate } = options; // Default to last 30 days

    const conditions = [eq(ProgressTrackingTable.userId, userId)];
    if (startDate) conditions.push(gte(ProgressTrackingTable.date, startDate.toISOString().split("T")[0]));
    if (endDate) conditions.push(lte(ProgressTrackingTable.date, endDate.toISOString().split("T")[0]));

    const data = await db.query.ProgressTrackingTable.findMany({
      where: and(...conditions),
      orderBy: [desc(ProgressTrackingTable.date)],
      limit,
    });

    return data.map((record) => ({
      id: record.progressId,
      userId: record.userId,
      date: new Date(record.date).toISOString().split("T")[0], // "YYYY-MM-DD" for graph clarity
      weight: Number(record.weight) || null,
      bodyFatPercentage: Number(record.bodyFatPercentage) || null,
      chest: Number(record.chest) || null,
      waist: Number(record.waist) || null,
      hips: Number(record.hips) || null,
      arms: Number(record.arms) || null,
      thighs: Number(record.thighs) || null,
      notes: record.notes || null,
    }));
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