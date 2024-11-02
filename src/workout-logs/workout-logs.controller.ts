import { Context } from "hono";
import { workoutLogsService } from "./workout-logs.service";
import { workoutLogSchema } from "../validators";


export const listWorkoutLogs = async (c: Context) => {
  try {
    const data = await workoutLogsService.list();
    if (!data || data.length === 0) {
      return c.json({ message: "No workout logs found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const getWorkoutLogById = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const data = await workoutLogsService.getById(Number(id));
    if (!data) {
      return c.json({ message: "Workout log not found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const getWorkoutLogsByUserId = async (c: Context) => {
  try {
    const userId = c.req.param("userId");
    const data = await workoutLogsService.getByUserId(Number(userId));
    if (!data || data.length === 0) {
      return c.json({ message: "No workout logs found for this user" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const createWorkoutLog = async (c: Context) => {
  try {
    const workoutLogData = await c.req.json();
    
    // Validate and transform the input data
    const validatedData = workoutLogSchema.parse(workoutLogData);
    
    const newWorkoutLog = await workoutLogsService.create(validatedData);
    return c.json(newWorkoutLog, 201);
  } catch (error: any) {
    if (error.errors) {
      // Zod validation error
      return c.json({ error: error.errors[0].message }, 400);
    }
    return c.json({ error: error?.message || "Failed to create workout log" }, 400);
  }
};

export const updateWorkoutLog = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const workoutLogData = await c.req.json();
    
    // Validate and transform the input data
    const validatedData = workoutLogSchema.partial().parse(workoutLogData);
    
    const updatedWorkoutLog = await workoutLogsService.update(Number(id), validatedData);
    if (!updatedWorkoutLog) {
      return c.json({ message: "Workout log not found" }, 404);
    }
    return c.json(updatedWorkoutLog, 200);
  } catch (error: any) {
    if (error.errors) {
      // Zod validation error
      return c.json({ error: error.errors[0].message }, 400);
    }
    return c.json({ error: error?.message || "Failed to update workout log" }, 400);
  }
};

export const deleteWorkoutLog = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const deleted = await workoutLogsService.delete(Number(id));
    if (!deleted) {
      return c.json({ message: "Workout log not found" }, 404);
    }
    return c.json({ message: "Workout log deleted successfully" }, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};