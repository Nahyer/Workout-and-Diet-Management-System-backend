import { Context } from "hono";
import { workoutSessionService } from "./workout-sessions.service";

export const listSessions = async (c: Context) => {
  try {
    const data = await workoutSessionService.list();
    if (!data || data.length === 0) {
      return c.json({ message: "No workout sessions found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const getSessionById = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const data = await workoutSessionService.getById(Number(id));
    if (!data) {
      return c.json({ message: "Workout session not found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const getSessionsByPlanId = async (c: Context) => {
  try {
    const planId = c.req.param("planId");
    const data = await workoutSessionService.getByPlanId(Number(planId));
    if (!data || data.length === 0) {
      return c.json({ message: "No workout sessions found for this plan" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const createSession = async (c: Context) => {
  try {
    const sessionData = await c.req.json();
    const newSession = await workoutSessionService.create(sessionData);
    return c.json(newSession, 201);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const updateSession = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const sessionData = await c.req.json();
    const updatedSession = await workoutSessionService.update(Number(id), sessionData);
    if (!updatedSession) {
      return c.json({ message: "Workout session not found" }, 404);
    }
    return c.json(updatedSession, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const deleteSession = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const deleted = await workoutSessionService.delete(Number(id));
    if (!deleted) {
      return c.json({ message: "Workout session not found" }, 404);
    }
    return c.json({ message: "Workout session deleted successfully" }, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};