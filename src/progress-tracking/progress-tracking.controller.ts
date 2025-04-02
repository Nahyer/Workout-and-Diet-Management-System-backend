import { Context } from "hono";
import { progressTrackingService } from "./progress-tracking.service";

export const listProgressTracking = async (c: Context) => {
  try {
    const data = await progressTrackingService.list();
    if (!data || data.length === 0) {
      return c.json({ message: "No progress records found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const getProgressTrackingById = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const data = await progressTrackingService.getById(Number(id));
    if (!data) {
      return c.json({ message: "Progress record not found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const getProgressTrackingByUserId = async (c: Context) => {
  try {
    const userId = Number(c.req.param("userId"));
    const { limit = "7", startDate, endDate } = c.req.query(); // Optional query params
    const data = await progressTrackingService.getByUserId(userId, {
      limit: Number(limit),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    if (!data || data.length === 0) {
      return c.json({ message: "No progress records found for this user" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const createProgressTracking = async (c: Context) => {
  try {
    const progressData = await c.req.json();
    const newProgress = await progressTrackingService.create(progressData);
    return c.json(newProgress, 201);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const updateProgressTracking = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const progressData = await c.req.json();
    const updatedProgress = await progressTrackingService.update(Number(id), progressData);
    if (!updatedProgress) {
      return c.json({ message: "Progress record not found" }, 404);
    }
    return c.json(updatedProgress, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const deleteProgressTracking = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const deleted = await progressTrackingService.delete(Number(id));
    if (!deleted) {
      return c.json({ message: "Progress record not found" }, 404);
    }
    return c.json({ message: "Progress record deleted successfully" }, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};