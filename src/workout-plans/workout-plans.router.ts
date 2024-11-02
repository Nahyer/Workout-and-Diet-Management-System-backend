import { Hono } from "hono";
import {
  listWorkoutPlans,
  getWorkoutPlanById,
  createWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan,
} from "./workout-plans.controller";
import { zValidator } from "@hono/zod-validator";
import { workoutPlanSchema } from "../validators";

export const workoutPlanRouter = new Hono();

workoutPlanRouter.get("/workout-plans/:userId", listWorkoutPlans);
workoutPlanRouter.get("/workout-plans/:id", getWorkoutPlanById);
workoutPlanRouter.post("/workout-plans", zValidator("json", workoutPlanSchema), createWorkoutPlan);
workoutPlanRouter.put("/workout-plans/:id", zValidator("json", workoutPlanSchema), updateWorkoutPlan);
workoutPlanRouter.delete("/workout-plans/:id", deleteWorkoutPlan);