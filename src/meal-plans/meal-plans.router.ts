import { Hono } from "hono";
import {
  listMealPlans,
  getMealPlanById,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  getMealPlansByNutritionPlanId
} from "./meal-plans.controller";
import { zValidator } from "@hono/zod-validator";
import { mealPlanSchema } from "../validators";

export const mealPlansRouter = new Hono();

mealPlansRouter.get("/meal-plans", listMealPlans);
mealPlansRouter.get("/meal-plans/:id", getMealPlanById);
mealPlansRouter.get("/nutrition-plans/:nutritionPlanId/meal-plans", getMealPlansByNutritionPlanId);
mealPlansRouter.post("/meal-plans", zValidator("json", mealPlanSchema), createMealPlan);
mealPlansRouter.put("/meal-plans/:id", zValidator("json", mealPlanSchema), updateMealPlan);
mealPlansRouter.delete("/meal-plans/:id", deleteMealPlan);