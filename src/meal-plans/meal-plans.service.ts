import { desc, eq } from "drizzle-orm";
import db from "../drizzle/db";
import { 
  MealPlansTable, 
  NutritionPlansTable,
  TIMealPlan 
} from "../drizzle/schema";

// Define types for detailed meal plan query
type MealPlanWithRelations = TIMealPlan & {
  nutritionPlan: {
    goal: string;
    dailyCalories: number;
  };
};

export const mealPlansService = {
  list: async (): Promise<MealPlanWithRelations[]> => {
    return await db.query.MealPlansTable.findMany({
      with: {
        nutritionPlan: {
          columns: {
            goal: true,
            dailyCalories: true,
          }
        }
      },
      orderBy: [
        desc(MealPlansTable.mealPlanId)
      ]
    }) as MealPlanWithRelations[];
  },

  getById: async (id: number): Promise<MealPlanWithRelations | undefined> => {
    return await db.query.MealPlansTable.findFirst({
      where: (mealPlans) => eq(mealPlans.mealPlanId, id),
      with: {
        nutritionPlan: {
          columns: {
            goal: true,
            dailyCalories: true,
          }
        }
      }
    }) as MealPlanWithRelations | undefined;
  },

  create: async (mealPlan: TIMealPlan): Promise<TIMealPlan> => {
    const [newMealPlan] = await db
      .insert(MealPlansTable)
      .values(mealPlan)
      .returning();
    return newMealPlan;
  },

  update: async (id: number, mealPlan: Partial<TIMealPlan>): Promise<TIMealPlan | null> => {
    const [updatedMealPlan] = await db
      .update(MealPlansTable)
      .set(mealPlan)
      .where(eq(MealPlansTable.mealPlanId, id))
      .returning();
    return updatedMealPlan || null;
  },

  delete: async (id: number): Promise<boolean> => {
    const result = await db
      .delete(MealPlansTable)
      .where(eq(MealPlansTable.mealPlanId, id))
      .returning();
    return result.length > 0;
  },

  // Additional method to get meal plans by nutrition plan ID
  getByNutritionPlanId: async (nutritionPlanId: number): Promise<MealPlanWithRelations[]> => {
    return await db.query.MealPlansTable.findMany({
      where: (mealPlans) => eq(mealPlans.nutritionPlanId, nutritionPlanId),
      with: {
        nutritionPlan: {
          columns: {
            goal: true,
            dailyCalories: true,
          }
        }
      }
    }) as MealPlanWithRelations[];
  }
};