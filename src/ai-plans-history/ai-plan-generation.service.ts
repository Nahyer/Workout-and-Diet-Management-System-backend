// ai-plans-history/ai-plan-generation.service.ts
import { eq, and } from "drizzle-orm";
import db from "../drizzle/db";
import { 
  AiConfigurationTable, 
  UsersTable,
  ExerciseLibraryTable,
  WorkoutPlansTable,
  WorkoutSessionsTable,
  WorkoutExercisesTable,
  AiPlansHistoryTable,
  ProgressTrackingTable,
  TSUser,
  TSAiConfiguration,
  TSExerciseLibrary,
  TIWorkoutPlan,
  TIWorkoutSession,
  TIWorkoutExercise,
  TIAiPlansHistory,
  fitnessGoalEnum,
  experienceLevelEnum
} from "../drizzle/schema";

// Define a more specific type for fitness goals that includes all possible values
type FitnessGoal = typeof fitnessGoalEnum.enumValues[number];
type ExperienceLevel = typeof experienceLevelEnum.enumValues[number];

// Utility function to calculate BMI
const calculateBMI = (heightCm: number, weightKg: number): number => {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
};

// Function to get a random integer between min and max (inclusive)
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Function to format a string by replacing underscores with spaces and capitalizing
const formatString = (str: string): string => {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const aiPlanGenerationService = {
  // Main function to generate a workout plan for a user
  generateWorkoutPlan: async (userId: number): Promise<boolean> => {
    try {
      // 1. Get user data
      const [user] = await db
        .select()
        .from(UsersTable)
        .where(eq(UsersTable.userId, userId));
      
      if (!user) {
        console.error(`User with ID ${userId} not found`);
        return false;
      }
      
      // 2. Find the appropriate AI configuration using rule-based logic
      const aiConfig = await determineAIConfiguration(user);
      
      if (!aiConfig) {
        console.error(`No matching AI configuration found for user ${userId}`);
        return false;
      }
      
      // 3. Create workout plan
      const workoutPlan = await createWorkoutPlan(user);
      
      // 4. Create workout sessions based on rule-determined split
      if (workoutPlan && workoutPlan.planId) {
        await createWorkoutSessions(workoutPlan.planId, aiConfig, user);
        
        // 5. Record this plan generation in AI plans history
        await recordPlanGeneration(userId, workoutPlan.planId, user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error generating workout plan:", error);
      return false;
    }
  }
};

// Rule-based function to determine the appropriate AI configuration
async function determineAIConfiguration(user: TSUser): Promise<TSAiConfiguration | undefined> {
  // First try to find an exact match configuration
  const [exactMatch] = await db
    .select()
    .from(AiConfigurationTable)
    .where(
      and(
        eq(AiConfigurationTable.fitnessGoal, user.fitnessGoal),
        eq(AiConfigurationTable.experienceLevel, user.experienceLevel),
        eq(AiConfigurationTable.workoutType, user.preferredWorkoutType)
      )
    );
  
  if (exactMatch) {
    return exactMatch;
  }
  
  // If no exact match, apply rule-based fallback logic
  // Rule 1: Try matching by goal and experience level
  const [goalLevelMatch] = await db
    .select()
    .from(AiConfigurationTable)
    .where(
      and(
        eq(AiConfigurationTable.fitnessGoal, user.fitnessGoal),
        eq(AiConfigurationTable.experienceLevel, user.experienceLevel)
      )
    );
  
  if (goalLevelMatch) {
    return goalLevelMatch;
  }
  
  // Rule 2: Try matching by just goal with default experience level
  const [goalMatch] = await db
    .select()
    .from(AiConfigurationTable)
    .where(
      eq(AiConfigurationTable.fitnessGoal, user.fitnessGoal)
    );
  
  if (goalMatch) {
    return goalMatch;
  }
  
  // Rule 3: Use a default configuration based on experience level
  const [defaultConfig] = await db
    .select()
    .from(AiConfigurationTable)
    .where(
      eq(AiConfigurationTable.experienceLevel, user.experienceLevel)
    );
  
  if (defaultConfig) {
    return defaultConfig;
  }
  
  // Rule 4: Absolute fallback - get the first available configuration
  const [anyConfig] = await db
    .select()
    .from(AiConfigurationTable)
    .limit(1);
  
  return anyConfig;
}

// Create a workout plan based on user profile
async function createWorkoutPlan(user: TSUser): Promise<TIWorkoutPlan> {
  // Rule-based plan naming and description
  let planName = "";
  let planDescription = "";
  let durationWeeks = 12; // Default
  
  // Rule set for naming the plan
  if (user.fitnessGoal === "weight_loss") {
    planName = "Fat Burning Plan";
    
    // Sub-rules based on experience level
    if (user.experienceLevel === "beginner") {
      planDescription = "Beginner-friendly fat loss program with progressive intensity";
      durationWeeks = 8; // Shorter for beginners
    } else if (user.experienceLevel === "intermediate") {
      planDescription = "Moderate intensity fat loss program with cardio acceleration";
      durationWeeks = 12;
    } else {
      planDescription = "Advanced fat loss program with high intensity intervals";
      durationWeeks = 16;
    }
  } 
  else if (user.fitnessGoal === "muscle_gain") {
    planName = "Muscle Building Plan";
    
    if (user.experienceLevel === "beginner") {
      planDescription = "Fundamental muscle building program focusing on form and progressive overload";
    } else if (user.experienceLevel === "intermediate") {
      planDescription = "Hypertrophy-focused program with periodized volume and intensity";
    } else {
      planDescription = "Advanced hypertrophy program with specialized techniques";
    }
  }
  // Use a different condition check for strength to fix the type comparison error
  else if (user.fitnessGoal.includes("strength")) {
    planName = "Strength Development Plan";
    
    if (user.experienceLevel === "beginner") {
      planDescription = "Linear progression strength program for beginners";
    } else if (user.experienceLevel === "intermediate") {
      planDescription = "Intermediate strength program with wave periodization";
    } else {
      planDescription = "Advanced strength program with specialized lifts and periodization";
    }
  }
  else {
    // Default fallback
    planName = `${formatString(user.fitnessGoal)} Plan`;
    planDescription = `Custom ${formatString(user.fitnessGoal)} plan for ${user.experienceLevel} level`;
  }
  
  // Create the plan
  const [workoutPlan] = await db
    .insert(WorkoutPlansTable)
    .values({
      userId: user.userId,
      name: planName,
      description: planDescription,
      goal: user.fitnessGoal,
      difficulty: user.experienceLevel,
      durationWeeks: durationWeeks,
      isAiGenerated: true,
      workoutType: user.preferredWorkoutType
    })
    .returning();
  
  return workoutPlan;
}

// Create workout sessions based on the determined split
async function createWorkoutSessions(
  planId: number, 
  aiConfig: TSAiConfiguration, 
  user: TSUser
): Promise<void> {
  // Get the muscle group split from the config
  const muscleGroupSplit = aiConfig.muscleGroupSplit as Record<string, string>;
  
  // For each day in the split configuration
  for (const [day, muscleGroup] of Object.entries(muscleGroupSplit)) {
    const dayNumber = parseInt(day.replace('day', ''));
    
    // Rule for rest days
    if (muscleGroup === 'rest') {
      // Create a rest day session
      await db
        .insert(WorkoutSessionsTable)
        .values({
          planId,
          dayNumber,
          name: `Day ${dayNumber}: Rest Day`,
          description: `Active recovery or complete rest`,
          targetMuscleGroups: "rest",
          duration: 0
        });
      continue;
    }
    
    // Rules for workout duration based on experience level and goal
    let sessionDuration = 60; // Default
    
    // Rule set for session duration
    if (user.experienceLevel === "beginner") {
      sessionDuration = getRandomInt(30, 45);
    } else if (user.experienceLevel === "intermediate") {
      sessionDuration = getRandomInt(45, 60);
    } else { // advanced
      sessionDuration = getRandomInt(60, 90);
    }
    
    // Adjust duration based on fitness goal
    // Fix type comparison by checking if the string includes the text instead
    if (user.fitnessGoal.includes("endurance")) {
      sessionDuration += 15; // Longer sessions for endurance
    } else if (user.fitnessGoal === "weight_loss") {
      sessionDuration += 10; // Slightly longer for weight loss
    }
    
    // Create session with rule-determined parameters
    const [session] = await db
      .insert(WorkoutSessionsTable)
      .values({
        planId,
        dayNumber,
        name: `Day ${dayNumber}: ${formatString(muscleGroup)}`,
        description: determineSessionDescription(muscleGroup, user.fitnessGoal, user.experienceLevel),
        targetMuscleGroups: muscleGroup,
        duration: sessionDuration
      })
      .returning();
    
    // Add exercises to this session
    await addExercisesToSession(session.sessionId, muscleGroup, aiConfig, user);
  }
}

// Rule-based function to determine session description
function determineSessionDescription(
  muscleGroup: string, 
  fitnessGoal: string, 
  experienceLevel: string
): string {
  const formattedMuscleGroup = formatString(muscleGroup);
  
  // Rules for description based on goal
  if (fitnessGoal === "weight_loss") {
    return `High intensity ${formattedMuscleGroup} workout with minimal rest to maximize calorie burn`;
  } 
  else if (fitnessGoal === "muscle_gain") {
    if (muscleGroup.includes("chest") || muscleGroup.includes("back") || muscleGroup.includes("legs")) {
      return `Heavy ${formattedMuscleGroup} workout focused on hypertrophy with progressive overload`;
    } else {
      return `Targeted ${formattedMuscleGroup} workout with isolation and compound movements`;
    }
  }
  // Fix comparison with string includes check
  else if (fitnessGoal.includes("strength")) {
    return `Heavy ${formattedMuscleGroup} workout with compound lifts and longer rest periods`;
  }
  // Fix comparison with string includes check
  else if (fitnessGoal.includes("endurance")) {
    return `High-rep ${formattedMuscleGroup} workout with minimal rest to build muscular endurance`;
  }
  
  // Default description
  return `Focus on ${formattedMuscleGroup}`;
}

// Add exercises to a workout session using rule-based selection
async function addExercisesToSession(
  sessionId: number, 
  muscleGroup: string, 
  aiConfig: TSAiConfiguration, 
  user: TSUser
): Promise<void> {
  try {
    // 1. Get suitable exercises from the exercise library
    const targetMuscles = muscleGroup.split('_');
    
    // Query all exercises that match the workout type
    const exercises = await db
      .select()
      .from(ExerciseLibraryTable)
      .where(
        eq(ExerciseLibraryTable.workoutType, user.preferredWorkoutType)
      );
    
    // Apply rule-based filtering for suitable exercises
    let suitableExercises: TSExerciseLibrary[] = [];
    
    // Rule 1: Filter by experience level match
    const exactLevelExercises = exercises.filter(ex => 
      ex.difficulty === user.experienceLevel && 
      targetMuscles.some((muscle: string) => 
        ex.targetMuscleGroup.toLowerCase().includes(muscle.toLowerCase())
      )
    );
    
    // If we have enough exercises at the exact level, use those
    if (exactLevelExercises.length >= (aiConfig.exerciseCountRange as { min: number; max: number }).min) {
      suitableExercises = exactLevelExercises;
    } 
    // Rule 2: If not enough exact matches, include adjacent difficulty levels
    else {
      let adjacentLevel = "";
      if (user.experienceLevel === "beginner") {
        adjacentLevel = "intermediate";
      } else if (user.experienceLevel === "advanced") {
        adjacentLevel = "intermediate";
      } else {
        // For intermediate, include both beginner and advanced
        suitableExercises = exercises.filter(ex => 
          (ex.difficulty === user.experienceLevel || 
           ex.difficulty === "beginner" || 
           ex.difficulty === "advanced") && 
          targetMuscles.some((muscle: string) => 
            ex.targetMuscleGroup.toLowerCase().includes(muscle.toLowerCase())
          )
        );
      }
      
      if (adjacentLevel) {
        suitableExercises = exercises.filter(ex => 
          (ex.difficulty === user.experienceLevel || 
           ex.difficulty === adjacentLevel) && 
          targetMuscles.some((muscle: string) => 
            ex.targetMuscleGroup.toLowerCase().includes(muscle.toLowerCase())
          )
        );
      }
    }
    
    // Rule 3: If still not enough, use any exercise that targets the muscle groups
    if (suitableExercises.length < (aiConfig.exerciseCountRange as { min: number; max: number }).min) {
      suitableExercises = exercises.filter(ex => 
        targetMuscles.some((muscle: string) => 
          ex.targetMuscleGroup.toLowerCase().includes(muscle.toLowerCase())
        )
      );
    }
    
    if (suitableExercises.length === 0) {
      console.warn(`No suitable exercises found for ${muscleGroup}`);
      return;
    }
    
    // Rule-based exercise selection and ordering
    let selectedExercises: TSExerciseLibrary[] = [];
    
    // Rule 4: For strength/muscle gain, prioritize compound exercises first
    // Fix type comparison with string includes check
    if (user.fitnessGoal === "muscle_gain" || user.fitnessGoal.includes("strength")) {
      // Identify compound exercises
      const compoundTerms = ['squat', 'deadlift', 'press', 'row', 'bench', 'pull-up', 'pullup', 'chin-up', 'chinup', 'dip'];
      const compoundExercises = suitableExercises.filter(ex => 
        compoundTerms.some(term => ex.name.toLowerCase().includes(term))
      );
      
      const isolationExercises = suitableExercises.filter(ex => 
        !compoundTerms.some(term => ex.name.toLowerCase().includes(term))
      );
      
      // Determine how many of each to include
      const exerciseCount = getRandomInt(
        (aiConfig.exerciseCountRange as { min: number; max: number }).min,
        (aiConfig.exerciseCountRange as { min: number; max: number }).max
      );
      
      // For strength/muscle, prioritize compounds (at least 60% of exercises)
      const minCompounds = Math.ceil(exerciseCount * 0.6);
      const compoundCount = Math.min(minCompounds, compoundExercises.length);
      const isolationCount = Math.min(exerciseCount - compoundCount, isolationExercises.length);
      
      // Select random compounds and isolations
      const selectedCompounds = compoundExercises
        .sort(() => 0.5 - Math.random())
        .slice(0, compoundCount);
      
      const selectedIsolations = isolationExercises
        .sort(() => 0.5 - Math.random())
        .slice(0, isolationCount);
      
      // Combine with compounds first
      selectedExercises = [...selectedCompounds, ...selectedIsolations];
    }
    // Rule 5: For weight loss, mix exercises for maximum calorie burn
    else if (user.fitnessGoal === "weight_loss") {
      const exerciseCount = getRandomInt(
        (aiConfig.exerciseCountRange as { min: number; max: number }).min + 1, // Add extra exercises for weight loss
        (aiConfig.exerciseCountRange as { min: number; max: number }).max + 2
      );
      
      selectedExercises = suitableExercises
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(exerciseCount, suitableExercises.length));
    }
    // Rule 6: Default selection for other goals
    else {
      const exerciseCount = getRandomInt(
        (aiConfig.exerciseCountRange as { min: number; max: number }).min,
        (aiConfig.exerciseCountRange as { min: number; max: number }).max
      );
      
      selectedExercises = suitableExercises
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(exerciseCount, suitableExercises.length));
    }
    
    // 4. Add each exercise to the session with rule-determined parameters
    for (let i = 0; i < selectedExercises.length; i++) {
      const exercise = selectedExercises[i];
      
      // Rule 7: Determine if exercise is compound
      const compoundTerms = ['squat', 'deadlift', 'press', 'row', 'bench', 'pull-up', 'pullup', 'chin-up', 'chinup', 'dip'];
      const isCompound = compoundTerms.some(term => 
        exercise.name.toLowerCase().includes(term)
      );
      
      // Rule 8: Set rep and set ranges based on goal and exercise type
      let sets = 0;
      let reps = 0;
      let restPeriod = 0;
      
      // Fix comparison with string includes check
      if (user.fitnessGoal.includes("strength")) {
        if (isCompound) {
          sets = getRandomInt(4, 5);
          reps = getRandomInt(3, 6);
          restPeriod = getRandomInt(180, 240); // 3-4 minutes
        } else {
          sets = getRandomInt(3, 4);
          reps = getRandomInt(6, 10);
          restPeriod = getRandomInt(120, 180); // 2-3 minutes
        }
      } 
      else if (user.fitnessGoal === "muscle_gain") {
        if (isCompound) {
          sets = getRandomInt(3, 5);
          reps = getRandomInt(6, 12);
          restPeriod = getRandomInt(90, 120); // 1.5-2 minutes
        } else {
          sets = getRandomInt(3, 4);
          reps = getRandomInt(8, 15);
          restPeriod = getRandomInt(60, 90); // 1-1.5 minutes
        }
      }
      else if (user.fitnessGoal === "weight_loss") {
        sets = getRandomInt(3, 4);
        reps = getRandomInt(12, 20);
        restPeriod = getRandomInt(30, 60); // 30s-1 minute
      }
      // Fix comparison with string includes check
      else if (user.fitnessGoal.includes("endurance")) {
        sets = getRandomInt(2, 4);
        reps = getRandomInt(15, 25);
        restPeriod = getRandomInt(30, 45); // 30-45 seconds
      }
      else {
        // Fallback to configuration ranges
        const setRange = isCompound 
          ? (aiConfig.setRanges as { compound: { min: number; max: number }; isolation: { min: number; max: number } }).compound 
          : (aiConfig.setRanges as { compound: { min: number; max: number }; isolation: { min: number; max: number } }).isolation;
          
        const repRange = isCompound 
          ? (aiConfig.repRanges as { compound: { min: number; max: number }; isolation: { min: number; max: number } }).compound 
          : (aiConfig.repRanges as { compound: { min: number; max: number }; isolation: { min: number; max: number } }).isolation;
        
        sets = getRandomInt(setRange.min, setRange.max);
        reps = getRandomInt(repRange.min, repRange.max);
        restPeriod = getRandomInt(
          (aiConfig.restPeriodRange as { min: number; max: number }).min, 
          (aiConfig.restPeriodRange as { min: number; max: number }).max
        );
      }
      
      // Create workout exercise with rule-determined parameters
      await db
        .insert(WorkoutExercisesTable)
        .values({
          sessionId,
          exerciseId: exercise.exerciseId,
          sets,
          reps,
          restPeriod,
          order: i + 1
        });
    }
  } catch (error) {
    console.error("Error adding exercises to session:", error);
  }
}

// Record plan generation in history
async function recordPlanGeneration(
  userId: number, 
  workoutPlanId: number, 
  user: TSUser
): Promise<void> {
  await db
    .insert(AiPlansHistoryTable)
    .values({
      userId,
      workoutPlanId,
      userInputs: JSON.stringify({
        fitnessGoal: user.fitnessGoal,
        experienceLevel: user.experienceLevel,
        workoutType: user.preferredWorkoutType,
        height: user.height,
        weight: user.weight
      })
    });
}