import { Context } from "hono";
import { exerciseLogsService } from "./exercise-logs.service";

export const listExerciseLogs = async (c: Context) => {
  try {
    const data = await exerciseLogsService.list();
    if (!data || data.length === 0) {
      return c.json({ message: "No exercise logs found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const getExerciseLogById = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const data = await exerciseLogsService.getById(Number(id));
    if (!data) {
      return c.json({ message: "Exercise log not found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const getExerciseLogsByLogId = async (c: Context) => {
  try {
    const logId = c.req.param("logId");
    const data = await exerciseLogsService.getByLogId(Number(logId));
    if (!data || data.length === 0) {
      return c.json({ message: "No exercise logs found for this workout log" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const createExerciseLog = async (c: Context) => {
  try {
    const exerciseLogData = await c.req.json();
    const newExerciseLog = await exerciseLogsService.create(exerciseLogData);
    return c.json(newExerciseLog, 201);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const updateExerciseLog = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const exerciseLogData = await c.req.json();
    const updatedExerciseLog = await exerciseLogsService.update(Number(id), exerciseLogData);
    if (!updatedExerciseLog) {
      return c.json({ message: "Exercise log not found" }, 404);
    }
    return c.json(updatedExerciseLog, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const deleteExerciseLog = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const deleted = await exerciseLogsService.delete(Number(id));
    if (!deleted) {
      return c.json({ message: "Exercise log not found" }, 404);
    }
    return c.json({ message: "Exercise log deleted successfully" }, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};
