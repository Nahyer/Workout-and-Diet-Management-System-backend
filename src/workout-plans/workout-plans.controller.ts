import { Context } from "hono";
import { workoutPlanService } from "./workout-plans.service";

export const listWorkoutPlans = async (c: Context) => {
  try {
    const userId = Number(c.req.param("userId"));
    const data = await workoutPlanService.list(userId);
    if (!data || data.length === 0) {
      return c.json({ message: "No workout plans found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const getWorkoutPlanById = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const data = await workoutPlanService.getById(Number(id));
    if (!data) {
      return c.json({ message: "Workout plan not found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const createWorkoutPlan = async (c: Context) => {
  try {
    const planData = await c.req.json();
    const newPlan = await workoutPlanService.create(planData);
    return c.json(newPlan, 201);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const updateWorkoutPlan = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const planData = await c.req.json();
    const updatedPlan = await workoutPlanService.update(Number(id), planData);
    if (!updatedPlan) {
      return c.json({ message: "Workout plan not found" }, 404);
    }
    return c.json(updatedPlan, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const deleteWorkoutPlan = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const deleted = await workoutPlanService.delete(Number(id));
    if (!deleted) {
      return c.json({ message: "Workout plan not found" }, 404);
    }
    return c.json({ message: "Workout plan deleted successfully" }, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};