import { Hono } from "hono";
import {
  listProgressTracking,
  getProgressTrackingById,
  getProgressTrackingByUserId,
  createProgressTracking,
  updateProgressTracking,
  deleteProgressTracking,
} from "./progress-tracking.controller";
import { zValidator } from "@hono/zod-validator";
import { progressTrackingSchema } from "../validators";

export const progressTrackingRouter = new Hono();

progressTrackingRouter.get("/progress", listProgressTracking);
progressTrackingRouter.get("/progress/:id", getProgressTrackingById);
progressTrackingRouter.get("/progress/user/:userId", getProgressTrackingByUserId);
progressTrackingRouter.post("/progress", zValidator("json", progressTrackingSchema), createProgressTracking);
progressTrackingRouter.put("/progress/:id", zValidator("json", progressTrackingSchema), updateProgressTracking);
progressTrackingRouter.delete("/progress/:id", deleteProgressTracking);
