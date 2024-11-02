import { Hono } from "hono";
import {
  listSessions,
  getSessionById,
  getSessionsByPlanId,
  createSession,
  updateSession,
  deleteSession,
} from "./workout-sessions.controller";
import { zValidator } from "@hono/zod-validator";
import { workoutSessionSchema } from "../validators";

export const workoutSessionRouter = new Hono();

workoutSessionRouter.get("/workout-sessions", listSessions);
workoutSessionRouter.get("/workout-sessions/:id", getSessionById);
workoutSessionRouter.get("/workout-plans/:planId/sessions", getSessionsByPlanId);
workoutSessionRouter.post("/workout-sessions", zValidator("json", workoutSessionSchema), createSession);
workoutSessionRouter.put("/workout-sessions/:id", zValidator("json", workoutSessionSchema), updateSession);
workoutSessionRouter.delete("/workout-sessions/:id", deleteSession);