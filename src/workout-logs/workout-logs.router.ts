import { Hono } from "hono";
import {
  listWorkoutLogs,
  getWorkoutLogById,
  getWorkoutLogsByUserId,
  createWorkoutLog,
  updateWorkoutLog,
  deleteWorkoutLog,
} from "./workout-logs.controller";
import { zValidator } from "@hono/zod-validator";
import { workoutLogSchema } from "../validators";

export const workoutLogsRouter = new Hono();

workoutLogsRouter.get("/workout-logs", listWorkoutLogs);
workoutLogsRouter.get("/workout-logs/:id", getWorkoutLogById);
workoutLogsRouter.get("/users/:userId/workout-logs", getWorkoutLogsByUserId);
workoutLogsRouter.post("/workout-logs", zValidator("json", workoutLogSchema), createWorkoutLog);
workoutLogsRouter.put("/workout-logs/:id", zValidator("json", workoutLogSchema), updateWorkoutLog);
workoutLogsRouter.delete("/workout-logs/:id", deleteWorkoutLog);
