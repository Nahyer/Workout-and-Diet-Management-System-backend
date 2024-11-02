import { eq, and } from "drizzle-orm";
import db from "../drizzle/db";
import { 
  AiConfigurationTable, 
  TIAiConfiguration,
  fitnessGoalEnum,
  experienceLevelEnum,
  workoutTypeEnum
} from "../drizzle/schema";

export const aiConfigurationService = {
  list: async (): Promise<TIAiConfiguration[]> => {
    const configs = await db.select().from(AiConfigurationTable);
    return configs;
  },

  getById: async (id: number): Promise<TIAiConfiguration | undefined> => {
    const [config] = await db
      .select()
      .from(AiConfigurationTable)
      .where(eq(AiConfigurationTable.configId, id));
    return config;
  },

  create: async (config: TIAiConfiguration): Promise<TIAiConfiguration> => {
    const [newConfig] = await db
      .insert(AiConfigurationTable)
      .values(config)
      .returning();
    return newConfig;
  },

  update: async (id: number, config: Partial<TIAiConfiguration>): Promise<TIAiConfiguration | null> => {
    const [updatedConfig] = await db
      .update(AiConfigurationTable)
      .set(config)
      .where(eq(AiConfigurationTable.configId, id))
      .returning();
    return updatedConfig || null;
  },

  delete: async (id: number): Promise<boolean> => {
    const result = await db
      .delete(AiConfigurationTable)
      .where(eq(AiConfigurationTable.configId, id))
      .returning();
    return result.length > 0;
  },

  getConfigurationByGoalAndLevel: async (
    fitnessGoal: (typeof fitnessGoalEnum.enumValues)[number],
    experienceLevel: (typeof experienceLevelEnum.enumValues)[number],
    workoutType: (typeof workoutTypeEnum.enumValues)[number]
  ): Promise<TIAiConfiguration | undefined> => {
    const [config] = await db
      .select()
      .from(AiConfigurationTable)
      .where(
        and(
          eq(AiConfigurationTable.fitnessGoal, fitnessGoal),
          eq(AiConfigurationTable.experienceLevel, experienceLevel),
          eq(AiConfigurationTable.workoutType, workoutType)
        )
      );
    return config;
  }
};