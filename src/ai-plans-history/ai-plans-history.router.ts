import { Hono } from "hono";
import {
  listHistories,
  getHistoryById,
  getHistoriesByUserId,
  createHistory,
  updateHistory,
  deleteHistory,
} from "./ai-plans-history.controller";
import { zValidator } from "@hono/zod-validator";
import { aiPlansHistorySchema } from "../validators";

export const aiPlansHistoryRouter = new Hono();

aiPlansHistoryRouter.get("/ai-plans-history", listHistories);
aiPlansHistoryRouter.get("/ai-plans-history/:id", getHistoryById);
aiPlansHistoryRouter.get("/ai-plans-history/user/:userId", getHistoriesByUserId);
aiPlansHistoryRouter.post("/ai-plans-history", zValidator("json", aiPlansHistorySchema), createHistory);
aiPlansHistoryRouter.put("/ai-plans-history/:id", zValidator("json", aiPlansHistorySchema), updateHistory);
aiPlansHistoryRouter.delete("/ai-plans-history/:id", deleteHistory);
