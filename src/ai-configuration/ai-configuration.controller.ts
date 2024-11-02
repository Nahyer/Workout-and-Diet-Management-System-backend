import { Context } from "hono";
import { aiConfigurationService } from "./ai-configuration.service";

export const listConfigurations = async (c: Context) => {
  try {
    const data = await aiConfigurationService.list();
    if (!data || data.length === 0) {
      return c.json({ message: "No configurations found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const getConfigurationById = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const data = await aiConfigurationService.getById(Number(id));
    if (!data) {
      return c.json({ message: "Configuration not found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const createConfiguration = async (c: Context) => {
  try {
    const configData = await c.req.json();
    const newConfig = await aiConfigurationService.create(configData);
    return c.json(newConfig, 201);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const updateConfiguration = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const configData = await c.req.json();
    const updatedConfig = await aiConfigurationService.update(Number(id), configData);
    if (!updatedConfig) {
      return c.json({ message: "Configuration not found" }, 404);
    }
    return c.json(updatedConfig, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const deleteConfiguration = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const deleted = await aiConfigurationService.delete(Number(id));
    if (!deleted) {
      return c.json({ message: "Configuration not found" }, 404);
    }
    return c.json({ message: "Configuration deleted successfully" }, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const getConfigByGoalAndLevel = async (c: Context) => {
    try {
      const { fitnessGoal, experienceLevel, workoutType } = c.req.query();
      if (!fitnessGoal || !experienceLevel || !workoutType) {
        return c.json({ message: "Missing required query parameters" }, 400);
      }
      
      // Type assertion to validate the query parameters
      if (!isValidFitnessGoal(fitnessGoal) || 
          !isValidExperienceLevel(experienceLevel) || 
          !isValidWorkoutType(workoutType)) {
        return c.json({ message: "Invalid query parameter values" }, 400);
      }
      
      const config = await aiConfigurationService.getConfigurationByGoalAndLevel(
        fitnessGoal,
        experienceLevel,
        workoutType
      );
      
      if (!config) {
        return c.json({ message: "No matching configuration found" }, 404);
      }
      
      return c.json(config, 200);
    } catch (error: any) {
      return c.json({ error: error?.message }, 500);
    }
  };
  
  // Type guard functions to validate the enum values
  function isValidFitnessGoal(value: string): value is "weight_loss" | "muscle_gain" | "maintenance" {
    return ["weight_loss", "muscle_gain", "maintenance"].includes(value);
  }
  
  function isValidExperienceLevel(value: string): value is "beginner" | "intermediate" | "advanced" {
    return ["beginner", "intermediate", "advanced"].includes(value);
  }
  
  function isValidWorkoutType(value: string): value is "home" | "gym" {
    return ["home", "gym"].includes(value);
  }