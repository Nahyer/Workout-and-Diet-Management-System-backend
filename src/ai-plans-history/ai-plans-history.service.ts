import { desc, eq } from "drizzle-orm";
import db from "../drizzle/db";
import { 
  AiPlansHistoryTable, 
  TIAiPlansHistory,
  UsersTable,
  WorkoutPlansTable,
  NutritionPlansTable
} from "../drizzle/schema";

type AiPlanHistoryWithDetails = {
  historyId: number;
  userId: number;
  workoutPlanId: number | null;
  nutritionPlanId: number | null;
  userInputs: Record<string, any>;
  generatedAt: Date;
  rating: number | null;
  feedback: string | null;
  user?: {
    fullName: string;
    email: string;
  };
  workoutPlan?: {
    name: string;
    description: string | null;
  } | null;
  nutritionPlan?: {
    dailyCalories: number;
    goal: string;
  } | null;
};

export const aiPlansHistoryService = {
  list: async (): Promise<AiPlanHistoryWithDetails[]> => {
    const histories = await db.query.AiPlansHistoryTable.findMany({
      with: {
        user: {
          columns: {
            fullName: true,
            email: true,
          },
        },
        workoutPlan: {
          columns: {
            name: true,
            description: true,
          },
        },
        nutritionPlan: {
          columns: {
            dailyCalories: true,
            goal: true,
          },
        },
      },
      orderBy: desc(AiPlansHistoryTable.generatedAt),
    }) as unknown as AiPlanHistoryWithDetails[];
    return histories;
  },

  getById: async (id: number): Promise<AiPlanHistoryWithDetails | undefined> => {
    const history = await db.query.AiPlansHistoryTable.findFirst({
      where: (histories) => eq(histories.historyId, id),
      with: {
        user: {
          columns: {
            fullName: true,
            email: true,
          },
        },
        workoutPlan: {
          columns: {
            name: true,
            description: true,
          },
        },
        nutritionPlan: {
          columns: {
            dailyCalories: true,
            goal: true,
          },
        },
      },
    }) as unknown as AiPlanHistoryWithDetails;
    return history || undefined;
  },

  getByUserId: async (userId: number): Promise<AiPlanHistoryWithDetails[]> => {
    const histories = await db.query.AiPlansHistoryTable.findMany({
      where: (histories) => eq(histories.userId, userId),
      with: {
        user: {
          columns: {
            fullName: true,
            email: true,
          },
        },
        workoutPlan: {
          columns: {
            name: true,
            description: true,
          },
        },
        nutritionPlan: {
          columns: {
            dailyCalories: true,
            goal: true,
          },
        },
      },
      orderBy: desc(AiPlansHistoryTable.generatedAt),
    }) as unknown as AiPlanHistoryWithDetails[];
    return histories;
  },

  create: async (history: TIAiPlansHistory): Promise<TIAiPlansHistory> => {
    const [newHistory] = await db
      .insert(AiPlansHistoryTable)
      .values(history)
      .returning();
    return newHistory;
  },

  update: async (id: number, history: Partial<TIAiPlansHistory>): Promise<TIAiPlansHistory | null> => {
    const [updatedHistory] = await db
      .update(AiPlansHistoryTable)
      .set(history)
      .where(eq(AiPlansHistoryTable.historyId, id))
      .returning();
    return updatedHistory || null;
  },

  delete: async (id: number): Promise<boolean> => {
    const result = await db
      .delete(AiPlansHistoryTable)
      .where(eq(AiPlansHistoryTable.historyId, id))
      .returning();
    return result.length > 0;
  },
};