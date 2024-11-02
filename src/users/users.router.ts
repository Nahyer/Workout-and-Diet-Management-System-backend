import { Hono } from "hono";
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "./users.controller";
import { zValidator } from "@hono/zod-validator";
import { userSchema } from "../validators";


export const userRouter = new Hono();

userRouter.get("/users", listUsers);
userRouter.get("/users/:id", getUserById);
userRouter.post("/users", zValidator("json", userSchema), createUser);
userRouter.put("/users/:id", zValidator("json", userSchema), updateUser);
userRouter.delete("/users/:id", deleteUser);
