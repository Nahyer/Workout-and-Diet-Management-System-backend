import { Context } from "hono";
import { nutritionPlanService } from "./nutrition-plans.service";

export const listNutritionPlans = async (c: Context) => {
  try {
    // Optional user-specific filtering
    const userId = c.req.query('userId') 
      ? Number(c.req.query('userId')) 
      : undefined;
    
    const data = await nutritionPlanService.list(userId);
    
    if (!data || data.length === 0) {
      return c.json({ message: "No nutrition plans found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const getNutritionPlanById = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const data = await nutritionPlanService.getById(Number(id));
    
    if (!data) {
      return c.json({ message: "Nutrition plan not found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const createNutritionPlan = async (c: Context) => {
  try {
    const nutritionPlanData = await c.req.json();
    const newNutritionPlan = await nutritionPlanService.create(nutritionPlanData);
    return c.json(newNutritionPlan, 201);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const updateNutritionPlan = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const nutritionPlanData = await c.req.json();
    
    const updatedNutritionPlan = await nutritionPlanService.update(
      Number(id), 
      nutritionPlanData
    );
    
    if (!updatedNutritionPlan) {
      return c.json({ message: "Nutrition plan not found" }, 404);
    }
    return c.json(updatedNutritionPlan, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const deleteNutritionPlan = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const deleted = await nutritionPlanService.delete(Number(id));
    
    if (!deleted) {
      return c.json({ message: "Nutrition plan not found" }, 404);
    }
    return c.json({ message: "Nutrition plan deleted successfully" }, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};