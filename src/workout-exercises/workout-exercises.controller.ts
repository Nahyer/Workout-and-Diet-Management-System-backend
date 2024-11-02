import { Context } from "hono";
import { workoutExerciseService } from "./workout-exercises.service";

export const listWorkoutExercises = async (c: Context) => {
  try {
    const data = await workoutExerciseService.list();
    if (!data || data.length === 0) {
      return c.json({ message: "No workout exercises found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const getWorkoutExerciseById = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const data = await workoutExerciseService.getById(Number(id));
    if (!data) {
      return c.json({ message: "Workout exercise not found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const getWorkoutExercisesBySessionId = async (c: Context) => {
  try {
    const sessionId = c.req.param("sessionId");
    const data = await workoutExerciseService.getBySessionId(Number(sessionId));
    if (!data || data.length === 0) {
      return c.json({ message: "No workout exercises found for this session" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const createWorkoutExercise = async (c: Context) => {
  try {
    const workoutExerciseData = await c.req.json();
    const newWorkoutExercise = await workoutExerciseService.create(workoutExerciseData);
    return c.json(newWorkoutExercise, 201);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const updateWorkoutExercise = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const workoutExerciseData = await c.req.json();
    const updatedWorkoutExercise = await workoutExerciseService.update(Number(id), workoutExerciseData);
    if (!updatedWorkoutExercise) {
      return c.json({ message: "Workout exercise not found" }, 404);
    }
    return c.json(updatedWorkoutExercise, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const deleteWorkoutExercise = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const deleted = await workoutExerciseService.delete(Number(id));
    if (!deleted) {
      return c.json({ message: "Workout exercise not found" }, 404);
    }
    return c.json({ message: "Workout exercise deleted successfully" }, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};