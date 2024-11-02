import { Context } from "hono";
import { aiPlansHistoryService } from "./ai-plans-history.service";

export const listHistories = async (c: Context) => {
  try {
    const data = await aiPlansHistoryService.list();
    if (!data || data.length === 0) {
      return c.json({ message: "No AI plan histories found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const getHistoryById = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const data = await aiPlansHistoryService.getById(Number(id));
    if (!data) {
      return c.json({ message: "AI plan history not found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const getHistoriesByUserId = async (c: Context) => {
  try {
    const userId = c.req.param("userId");
    const data = await aiPlansHistoryService.getByUserId(Number(userId));
    if (!data || data.length === 0) {
      return c.json({ message: "No AI plan histories found for this user" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const createHistory = async (c: Context) => {
  try {
    const historyData = await c.req.json();
    const newHistory = await aiPlansHistoryService.create(historyData);
    return c.json(newHistory, 201);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const updateHistory = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const historyData = await c.req.json();
    const updatedHistory = await aiPlansHistoryService.update(Number(id), historyData);
    if (!updatedHistory) {
      return c.json({ message: "AI plan history not found" }, 404);
    }
    return c.json(updatedHistory, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const deleteHistory = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const deleted = await aiPlansHistoryService.delete(Number(id));
    if (!deleted) {
      return c.json({ message: "AI plan history not found" }, 404);
    }
    return c.json({ message: "AI plan history deleted successfully" }, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};