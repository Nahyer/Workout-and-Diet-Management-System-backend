// backend/meal-consumption/meal-consumption.router.ts
import { Hono } from 'hono';
import { db } from '../drizzle/db';
import { eq, and, gte, lte } from 'drizzle-orm';
import { MealConsumptionLogsTable, MealPlansTable } from '../drizzle/schema';

export const mealConsumptionRouter = new Hono();

// Existing endpoint to mark a meal as consumed
mealConsumptionRouter.post('/meals/consume', async (c) => {
  const { userId, mealPlanId } = await c.req.json();

  try {
    const [meal] = await db
      .select({
        calories: MealPlansTable.calories,
        protein: MealPlansTable.protein,
        carbs: MealPlansTable.carbs,
        fat: MealPlansTable.fat,
        dayNumber: MealPlansTable.dayNumber,
      })
      .from(MealPlansTable)
      .where(eq(MealPlansTable.mealPlanId, mealPlanId))
      .limit(1);

    if (!meal) {
      return c.json({ error: 'Meal not found' }, 404);
    }

    const [consumption] = await db
      .insert(MealConsumptionLogsTable)
      .values({
        userId,
        mealPlanId,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
      })
      .returning();

    return c.json({ success: true, consumption });
  } catch (error) {
    console.error('Error logging meal consumption:', error);
    return c.json({ error: 'Failed to log meal consumption' }, 500);
  }
});

// New endpoint to fetch consumed meals
mealConsumptionRouter.get('/meal-consumption', async (c) => {
  const userId = parseInt(c.req.query('userId') || '0');
  const startDate = new Date(c.req.query('startDate') || '');
  const endDate = new Date(c.req.query('endDate') || '');

  if (!userId || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return c.json({ error: 'Invalid parameters' }, 400);
  }

  try {
    const consumedMeals = await db
      .select({
        mealPlanId: MealConsumptionLogsTable.mealPlanId,
        consumedAt: MealConsumptionLogsTable.consumedAt,
        dayNumber: MealPlansTable.dayNumber,
      })
      .from(MealConsumptionLogsTable)
      .innerJoin(MealPlansTable, eq(MealConsumptionLogsTable.mealPlanId, MealPlansTable.mealPlanId))
      .where(and(
        eq(MealConsumptionLogsTable.userId, userId),
        gte(MealConsumptionLogsTable.consumedAt, startDate),
        lte(MealConsumptionLogsTable.consumedAt, endDate)
      ));

    return c.json(consumedMeals);
  } catch (error) {
    console.error('Error fetching consumed meals:', error);
    return c.json({ error: 'Failed to fetch consumed meals' }, 500);
  }
});

export default mealConsumptionRouter;