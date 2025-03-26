import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { progressTrackingSchema } from "../validators";
import {
  listProgressTracking,
  getProgressTrackingById,
  getProgressTrackingByUserId,
  createProgressTracking,
  updateProgressTracking,
  deleteProgressTracking,
} from "./progress-tracking.controller";

export const progressTrackingRouter = new Hono();

// Basic CRUD (unchanged for now, but we’ll enhance getByUserId)
progressTrackingRouter.get("/progress", listProgressTracking);
progressTrackingRouter.get("/progress/:id", getProgressTrackingById);
progressTrackingRouter.get("/progress/user/:userId", getProgressTrackingByUserId);
progressTrackingRouter.post("/progress", zValidator("json", progressTrackingSchema), createProgressTracking);
progressTrackingRouter.put("/progress/:id", zValidator("json", progressTrackingSchema), updateProgressTracking);
progressTrackingRouter.delete("/progress/:id", deleteProgressTracking);

export default progressTrackingRouter;