import { Context } from "hono";
import { mealPlansService } from "./meal-plans.service";

export const listMealPlans = async (c: Context) => {
  try {
    const data = await mealPlansService.list();
    if (!data || data.length === 0) {
      return c.json({ message: "No meal plans found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const getMealPlanById = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const data = await mealPlansService.getById(Number(id));
    if (!data) {
      return c.json({ message: "Meal plan not found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const getMealPlansByNutritionPlanId = async (c: Context) => {
  try {
    const nutritionPlanId = c.req.param("nutritionPlanId");
    const data = await mealPlansService.getByNutritionPlanId(Number(nutritionPlanId));
    if (!data || data.length === 0) {
      return c.json({ message: "No meal plans found for this nutrition plan" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const createMealPlan = async (c: Context) => {
  try {
    const mealPlanData = await c.req.json();
    const newMealPlan = await mealPlansService.create(mealPlanData);
    return c.json(newMealPlan, 201);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const updateMealPlan = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const mealPlanData = await c.req.json();
    const updatedMealPlan = await mealPlansService.update(Number(id), mealPlanData);
    if (!updatedMealPlan) {
      return c.json({ message: "Meal plan not found" }, 404);
    }
    return c.json(updatedMealPlan, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const deleteMealPlan = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const deleted = await mealPlansService.delete(Number(id));
    if (!deleted) {
      return c.json({ message: "Meal plan not found" }, 404);
    }
    return c.json({ message: "Meal plan deleted successfully" }, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};