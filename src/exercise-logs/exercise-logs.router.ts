import { Hono } from "hono";
import {
  listExerciseLogs,
  getExerciseLogById,
  getExerciseLogsByLogId,
  createExerciseLog,
  updateExerciseLog,
  deleteExerciseLog
} from "./exercise-logs.controller";
import { zValidator } from "@hono/zod-validator";
import { exerciseLogSchema } from "../validators";

export const exerciseLogsRouter = new Hono();

exerciseLogsRouter.get("/exercise-logs", listExerciseLogs);
exerciseLogsRouter.get("/exercise-logs/:id", getExerciseLogById);
exerciseLogsRouter.get("/workout-logs/:logId/exercises", getExerciseLogsByLogId);
exerciseLogsRouter.post("/exercise-logs", zValidator("json", exerciseLogSchema), createExerciseLog);
exerciseLogsRouter.put("/exercise-logs/:id", zValidator("json", exerciseLogSchema), updateExerciseLog);
exerciseLogsRouter.delete("/exercise-logs/:id", deleteExerciseLog);
