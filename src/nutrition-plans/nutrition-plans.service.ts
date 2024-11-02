import { desc, eq } from "drizzle-orm";
import db from "../drizzle/db";
import { 
  NutritionPlansTable, 
  TINutritionPlan, 
  TSNutritionPlan 
} from "../drizzle/schema";

export const nutritionPlanService = {
  list: async (userId?: number): Promise<TSNutritionPlan[]> => {
    if (userId) {
      return await db.query.NutritionPlansTable.findMany({
        where: (plans) => eq(plans.userId, userId),
        orderBy: [desc(NutritionPlansTable.createdAt)],
        with: {
          mealPlans: true, // Include related meal plans
        },
      });
    }
    return await db.query.NutritionPlansTable.findMany({
      orderBy: [desc(NutritionPlansTable.createdAt)],
      with: {
        mealPlans: true, // Include related meal plans for all nutrition plans
      },
    });
  },

  getById: async (id: number): Promise<TSNutritionPlan | undefined> => {
    return await db.query.NutritionPlansTable.findFirst({
      where: (plans) => eq(plans.nutritionPlanId, id),
      with: {
        mealPlans: true, // Include related meal plans
      },
    });
  },

  create: async (nutritionPlan: TINutritionPlan): Promise<TSNutritionPlan> => {
    const [newNutritionPlan] = await db
      .insert(NutritionPlansTable)
      .values(nutritionPlan)
      .returning();
    return newNutritionPlan;
  },

  update: async (
    id: number, 
    nutritionPlan: Partial<TINutritionPlan>
  ): Promise<TSNutritionPlan | null> => {
    const [updatedNutritionPlan] = await db
      .update(NutritionPlansTable)
      .set({
        ...nutritionPlan,
        updatedAt: new Date(), // Always update timestamp
      })
      .where(eq(NutritionPlansTable.nutritionPlanId, id))
      .returning();
    return updatedNutritionPlan || null;
  },

  delete: async (id: number): Promise<boolean> => {
    const result = await db
      .delete(NutritionPlansTable)
      .where(eq(NutritionPlansTable.nutritionPlanId, id))
      .returning();
    return result.length > 0;
  },
};