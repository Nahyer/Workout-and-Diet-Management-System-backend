import { Context } from "hono";
import { exerciseLibraryService } from "./exercise-library.service";

export const listExercises = async (c: Context) => {
  try {
    const data = await exerciseLibraryService.list();
    if (!data || data.length === 0) {
      return c.json({ message: "No exercises found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const getExerciseById = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const data = await exerciseLibraryService.getById(Number(id));
    if (!data) {
      return c.json({ message: "Exercise not found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const createExercise = async (c: Context) => {
  try {
    const exerciseData = await c.req.json();
    const newExercise = await exerciseLibraryService.create(exerciseData);
    return c.json(newExercise, 201);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const updateExercise = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const exerciseData = await c.req.json();
    const updatedExercise = await exerciseLibraryService.update(Number(id), exerciseData);
    if (!updatedExercise) {
      return c.json({ message: "Exercise not found" }, 404);
    }
    return c.json(updatedExercise, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const deleteExercise = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const deleted = await exerciseLibraryService.delete(Number(id));
    if (!deleted) {
      return c.json({ message: "Exercise not found" }, 404);
    }
    return c.json({ message: "Exercise deleted successfully" }, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};
