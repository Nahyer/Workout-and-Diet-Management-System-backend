import { Hono } from "hono";
import {
  listExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
  
} from "./exercise-library.controller";
import { zValidator } from "@hono/zod-validator";
import { exerciseLibrarySchema } from "../validators";

export const exerciseLibraryRouter = new Hono();

exerciseLibraryRouter.get("/exercises", listExercises);
exerciseLibraryRouter.get("/exercises/:id", getExerciseById);
exerciseLibraryRouter.post("/exercises", zValidator("json", exerciseLibrarySchema), createExercise);
exerciseLibraryRouter.put("/exercises/:id", zValidator("json", exerciseLibrarySchema), updateExercise);
exerciseLibraryRouter.delete("/exercises/:id", deleteExercise);