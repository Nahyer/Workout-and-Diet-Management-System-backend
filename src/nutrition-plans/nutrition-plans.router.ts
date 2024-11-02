import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { 
  listNutritionPlans, 
  getNutritionPlanById, 
  createNutritionPlan, 
  updateNutritionPlan, 
  deleteNutritionPlan 
} from "./nutrition-plans.controller";
import { nutritionPlanSchema } from "../validators";

export const nutritionPlanRouter = new Hono();

nutritionPlanRouter.get("/nutrition-plans", listNutritionPlans);
nutritionPlanRouter.get("/nutrition-plans/:id", getNutritionPlanById);
nutritionPlanRouter.post("/nutrition-plans", zValidator("json", nutritionPlanSchema), createNutritionPlan);
nutritionPlanRouter.put("/nutrition-plans/:id", zValidator("json", nutritionPlanSchema), updateNutritionPlan);
nutritionPlanRouter.delete("/nutrition-plans/:id", deleteNutritionPlan);