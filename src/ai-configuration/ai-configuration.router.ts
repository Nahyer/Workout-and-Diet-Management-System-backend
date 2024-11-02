import { Hono } from "hono";
import {
  listConfigurations,
  getConfigurationById,
  createConfiguration,
  updateConfiguration,
  deleteConfiguration,
  getConfigByGoalAndLevel
} from "./ai-configuration.controller";
import { zValidator } from "@hono/zod-validator";
import { aiConfigurationSchema } from "../validators";

export const aiConfigurationRouter = new Hono();

aiConfigurationRouter.get("/ai-configurations", listConfigurations);
aiConfigurationRouter.get("/ai-configurations/:id", getConfigurationById);
aiConfigurationRouter.get("/ai-configurations/match", getConfigByGoalAndLevel);
aiConfigurationRouter.post("/ai-configurations", zValidator("json", aiConfigurationSchema), createConfiguration);
aiConfigurationRouter.put("/ai-configurations/:id", zValidator("json", aiConfigurationSchema), updateConfiguration);
aiConfigurationRouter.delete("/ai-configurations/:id", deleteConfiguration);