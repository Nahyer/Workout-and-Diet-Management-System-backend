// backend/dashboard/dashboard.router.ts
import { Hono } from "hono";
import { db } from "../drizzle/db";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import {
  UsersTable,
  WorkoutSessionsTable,
  NutritionPlansTable,
  ProgressTrackingTable,
  WorkoutLogsTable,
  MealPlansTable,
  WorkoutPlansTable,
  MealConsumptionLogsTable,
} from "../drizzle/schema";

export const dashboardRouter = new Hono();

dashboardRouter.get("/dashboard/:userId", async (c) => {
  const userId = parseInt(c.req.param("userId"));

  try {
    const [user] = await db
      .select({
        fullName: UsersTable.fullName,
        loginStreak: UsersTable.loginStreak,
      })
      .from(UsersTable)
      .where(eq(UsersTable.userId, userId))
      .limit(1);

    if (!user) return c.json({ error: "User not found" }, 404);

    const today = new Date().toISOString().split("T")[0];
    const [todaysWorkout] = await db
      .select({
        name: WorkoutSessionsTable.name,
        description: WorkoutSessionsTable.description,
        duration: WorkoutSessionsTable.duration,
        targetMuscleGroups: WorkoutSessionsTable.targetMuscleGroups,
      })
      .from(WorkoutSessionsTable)
      .innerJoin(
        WorkoutPlansTable,
        eq(WorkoutSessionsTable.planId, WorkoutPlansTable.planId)
      )
      .where(
        and(
          eq(WorkoutPlansTable.userId, userId),
          eq(WorkoutSessionsTable.dayNumber, new Date().getDay())
        )
      )
      .limit(1);

    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const consumedMeals = await db
      .select({
        calories: MealConsumptionLogsTable.calories,
      })
      .from(MealConsumptionLogsTable)
      .where(
        and(
          eq(MealConsumptionLogsTable.userId, userId),
          and(
            gte(MealConsumptionLogsTable.consumedAt, todayStart),
            lte(MealConsumptionLogsTable.consumedAt, todayEnd)
          )
        )
      );

    const caloriesToday = consumedMeals.reduce(
      (sum, meal) => sum + (meal.calories || 0),
      0
    );

    const [nutritionPlan] = await db
      .select({
        dailyCalories: NutritionPlansTable.dailyCalories,
        proteinGrams: NutritionPlansTable.proteinGrams,
        carbsGrams: NutritionPlansTable.carbsGrams,
        fatGrams: NutritionPlansTable.fatGrams,
      })
      .from(NutritionPlansTable)
      .where(eq(NutritionPlansTable.userId, userId))
      .limit(1);

    const weightData = await db
      .select({
        date: ProgressTrackingTable.date,
        weight: ProgressTrackingTable.weight,
      })
      .from(ProgressTrackingTable)
      .where(eq(ProgressTrackingTable.userId, userId))
      .orderBy(desc(ProgressTrackingTable.date))
      .limit(7);

    const workoutLogs = await db
      .select({
        date: WorkoutLogsTable.date,
        completed: WorkoutLogsTable.completed,
      })
      .from(WorkoutLogsTable)
      .where(eq(WorkoutLogsTable.userId, userId))
      .orderBy(desc(WorkoutLogsTable.date))
      .limit(30);

    const goals = {
      calories: nutritionPlan?.dailyCalories || 2200,
      proteinGrams: nutritionPlan?.proteinGrams || 150,
      carbsGrams: nutritionPlan?.carbsGrams || 200,
      fatGrams: nutritionPlan?.fatGrams || 70,
      workoutCompleted: workoutLogs.some(
        (log) => log.date.toISOString().split("T")[0] === today && log.completed
      ),
    };

    return c.json({
      user: { fullName: user.fullName },
      streak: user.loginStreak || 0,
      todaysWorkout: todaysWorkout || null,
      caloriesToday,
      weightData: weightData.map((w) => ({
        date: w.date.split("T")[0], // Full "YYYY-MM-DD"
        weight: parseFloat(w.weight || "0"),
      })),
      goals,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return c.json({ error: "Failed to fetch dashboard data" }, 500);
  }
});

export default dashboardRouter;