import { Hono } from "hono";
import {
  listWorkoutExercises,
  getWorkoutExerciseById,
  getWorkoutExercisesBySessionId,
  createWorkoutExercise,
  updateWorkoutExercise,
  deleteWorkoutExercise,
} from "./workout-exercises.controller";
import { zValidator } from "@hono/zod-validator";
import { workoutExerciseSchema } from "../validators";

export const workoutExerciseRouter = new Hono();

workoutExerciseRouter.get("/workout-exercises", listWorkoutExercises);
workoutExerciseRouter.get("/workout-exercises/:id", getWorkoutExerciseById);
workoutExerciseRouter.get("/workout-sessions/:sessionId/exercises", getWorkoutExercisesBySessionId);
workoutExerciseRouter.post("/workout-exercises", zValidator("json", workoutExerciseSchema), createWorkoutExercise);
workoutExerciseRouter.put("/workout-exercises/:id", zValidator("json", workoutExerciseSchema), updateWorkoutExercise);
workoutExerciseRouter.delete("/workout-exercises/:id", deleteWorkoutExercise);
