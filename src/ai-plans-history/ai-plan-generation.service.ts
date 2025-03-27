// ai-plans-history/ai-plan-generation.service.ts
import { eq, and, or, like } from "drizzle-orm";
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
      console.log(`Starting workout plan generation for user ID: ${userId}`);
      
      // 1. Get user data
      const [user] = await db
        .select()
        .from(UsersTable)
        .where(eq(UsersTable.userId, userId));
      
      if (!user) {
        console.error(`User with ID ${userId} not found`);
        return false;
      }
      
      console.log(`User found: ${user.fullName}, goal: ${user.fitnessGoal}, experience: ${user.experienceLevel}`);
      
      // 2. Find the appropriate AI configuration using rule-based logic
      const aiConfig = await determineAIConfiguration(user);
      
      if (!aiConfig) {
        console.error(`No matching AI configuration found for user ${userId}`);
        return false;
      }
      
      console.log(`AI configuration determined: ID ${aiConfig.configId}`);
      
      // 3. Create workout plan
      const workoutPlan = await createWorkoutPlan(user);
      console.log(`Created workout plan: ${workoutPlan?.name} (ID: ${workoutPlan?.planId})`);
      
      // 4. Create workout sessions based on rule-determined split
      if (workoutPlan && workoutPlan.planId) {
        await createWorkoutSessions(workoutPlan.planId, aiConfig, user);
        
        // 5. Record this plan generation in AI plans history
        await recordPlanGeneration(userId, workoutPlan.planId, user);
        console.log(`Workout plan generation completed successfully for user ${userId}`);
        return true;
      }
      
      console.error(`Failed to create workout plan for user ${userId}`);
      return false;
    } catch (error) {
      console.error("Error generating workout plan:", error);
      return false;
    }
  }
};

// Rule-based function to determine the appropriate AI configuration
async function determineAIConfiguration(user: TSUser): Promise<TSAiConfiguration | undefined> {
  console.log(`Determining AI configuration for user with goal: ${user.fitnessGoal}, experience: ${user.experienceLevel}`);
  
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
    console.log(`Found exact match configuration: ID ${exactMatch.configId}`);
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
    console.log(`Found goal and experience level match: ID ${goalLevelMatch.configId}`);
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
    console.log(`Found goal match: ID ${goalMatch.configId}`);
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
    console.log(`Found default config for experience level: ID ${defaultConfig.configId}`);
    return defaultConfig;
  }
  
  // Rule 4: Absolute fallback - get the first available configuration
  const [anyConfig] = await db
    .select()
    .from(AiConfigurationTable)
    .limit(1);
  
  if (anyConfig) {
    console.log(`Using fallback configuration: ID ${anyConfig.configId}`);
  } else {
    console.error("No AI configurations found in the database");
  }
  
  return anyConfig;
}

// Create a workout plan based on user profile
async function createWorkoutPlan(user: TSUser): Promise<TIWorkoutPlan> {
  console.log(`Creating workout plan for user: ${user.userId}, goal: ${user.fitnessGoal}`);
  
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
  
  console.log(`Plan name: "${planName}", description: "${planDescription}", duration: ${durationWeeks} weeks`);
  
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
  console.log(`Creating workout sessions for plan ID: ${planId}`);
  
  // Get the muscle group split from the config
  const muscleGroupSplit = aiConfig.muscleGroupSplit as Record<string, string>;
  console.log(`Muscle group split: ${JSON.stringify(muscleGroupSplit)}`);
  
  // For each day in the split configuration
  for (const [day, muscleGroup] of Object.entries(muscleGroupSplit)) {
    const dayNumber = parseInt(day.replace('day', ''));
    console.log(`Creating session for day ${dayNumber}: ${muscleGroup}`);
    
    // Rule for rest days
    if (muscleGroup === 'rest') {
      // Create a rest day session
      const [restSession] = await db
        .insert(WorkoutSessionsTable)
        .values({
          planId,
          dayNumber,
          name: `Day ${dayNumber}: Rest Day`,
          description: `Active recovery or complete rest`,
          targetMuscleGroups: "rest",
          duration: 0
        })
        .returning();
        
      console.log(`Created rest day session: ${restSession.sessionId}`);
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
    
    console.log(`Created workout session: ${session.sessionId}, duration: ${sessionDuration} minutes`);
    
    // Add exercises to this session
    await addExercisesToSession(session.sessionId, muscleGroup, aiConfig, user);
  }
  
  console.log(`Finished creating all workout sessions for plan ID: ${planId}`);
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
    console.log(`Adding exercises for session ${sessionId}, muscle group: ${muscleGroup}`);
    
    // Create a mapping for specialized workout types to traditional muscle groups
    // This allows us to find appropriate exercises even without specialized tags
    const specializedWorkoutMap: Record<string, string[]> = {
      "hiit_strength": ["chest", "back", "legs", "full body"],
      "cardio_core": ["core", "full body"],
      "tabata": ["full body", "core", "cardio"],
      "circuit_training": ["full body", "chest", "back", "legs"],
      "endurance": ["legs", "full body"],
      "active_recovery": ["core", "full body"],
      // Add more mappings as needed
    };
    
    let targetMuscles: string[] = [];
    
    // Check if we have a specialized workout type
    if (muscleGroup in specializedWorkoutMap) {
      console.log(`Using specialized mapping for ${muscleGroup}`);
      targetMuscles = specializedWorkoutMap[muscleGroup];
    } else {
      // Traditional muscle group splitting
      targetMuscles = muscleGroup.split('_');
    }
    
    console.log(`Target muscles for ${muscleGroup}: ${targetMuscles.join(', ')}`);
    
    // Query all exercises that match the workout type
    const exercises = await db
      .select()
      .from(ExerciseLibraryTable)
      .where(
        eq(ExerciseLibraryTable.workoutType, user.preferredWorkoutType)
      );
    
    console.log(`Found ${exercises.length} exercises matching workout type: ${user.preferredWorkoutType}`);
    
    // Apply rule-based filtering for suitable exercises
    let suitableExercises: TSExerciseLibrary[] = [];
    
    // Rule 1: Filter by experience level match AND target muscle groups
    const exactLevelExercises = exercises.filter(ex => 
      ex.difficulty === user.experienceLevel && 
      targetMuscles.some(muscle => 
        ex.targetMuscleGroup.toLowerCase().includes(muscle.toLowerCase())
      )
    );
    
    console.log(`Found ${exactLevelExercises.length} exercises matching exact level and target muscles`);
    
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
          targetMuscles.some(muscle => 
            ex.targetMuscleGroup.toLowerCase().includes(muscle.toLowerCase())
          )
        );
      }
      
      if (adjacentLevel) {
        suitableExercises = exercises.filter(ex => 
          (ex.difficulty === user.experienceLevel || 
           ex.difficulty === adjacentLevel) && 
          targetMuscles.some(muscle => 
            ex.targetMuscleGroup.toLowerCase().includes(muscle.toLowerCase())
          )
        );
      }
      
      console.log(`After relaxing difficulty constraints: ${suitableExercises.length} suitable exercises`);
    }
    
    // Rule 3: If still not enough, use any exercise that targets the muscle groups
    if (suitableExercises.length < (aiConfig.exerciseCountRange as { min: number; max: number }).min) {
      console.log(`Still not enough exercises, relaxing muscle group constraints...`);
      suitableExercises = exercises.filter(ex => 
        targetMuscles.some(muscle => 
          ex.targetMuscleGroup.toLowerCase().includes(muscle.toLowerCase())
        )
      );
    }
    
    // Rule 4: For specialized workout types, add specialized exercise selection logic
    if (suitableExercises.length < (aiConfig.exerciseCountRange as { min: number; max: number }).min) {
      console.log(`Using specialized selection for ${muscleGroup}...`);
      
      if (muscleGroup === "hiit_strength") {
        // For HIIT, prioritize compound exercises that can be done intensely
        suitableExercises = exercises.filter(ex => 
          ["burpees", "squat", "push", "pull", "press", "jump", "mountain climber", "lunge", "plank"].some(
            term => ex.name.toLowerCase().includes(term)
          )
        );
      } 
      else if (muscleGroup === "tabata") {
        // For tabata, use exercises that can be done for very short intense intervals
        suitableExercises = exercises.filter(ex => 
          ["jump", "push", "squat", "burpee", "climber", "jack", "sprint", "sit-up", "plank"].some(
            term => ex.name.toLowerCase().includes(term)
          )
        );
      }
      else if (muscleGroup === "circuit_training") {
        // For circuit training, use a variety of full-body exercises
        suitableExercises = exercises.filter(ex => 
          ex.equipment === "None" || ex.equipment === "Dumbbells" ||
          ex.targetMuscleGroup.toLowerCase().includes("full body")
        );
      }
      else if (muscleGroup === "endurance") {
        // For endurance, focus on exercises that can be sustained
        suitableExercises = exercises.filter(ex => 
          ["run", "cycle", "climb", "step", "jump", "squat", "lunge", "press"].some(
            term => ex.name.toLowerCase().includes(term)
          )
        );
      }
      else if (muscleGroup === "active_recovery") {
        // For active recovery, use low-intensity exercises
        suitableExercises = exercises.filter(ex => 
          ex.difficulty === "beginner"
        );
      }
      
      console.log(`After specialized selection: ${suitableExercises.length} suitable exercises`);
    }
    
    // Rule 5: If STILL not enough exercises, use ANY exercises from the database as a last resort
    if (suitableExercises.length < (aiConfig.exerciseCountRange as { min: number; max: number }).min) {
      console.log(`Using ANY available exercises as last resort...`);
      
      const minExercises = (aiConfig.exerciseCountRange as { min: number; max: number }).min;
      // First, use what we've already found
      const additionalNeeded = minExercises - suitableExercises.length;
      
      // Get additional random exercises that we haven't already selected
      const additionalExercises = exercises
        .filter(ex => !suitableExercises.some(selected => selected.exerciseId === ex.exerciseId))
        .sort(() => 0.5 - Math.random())
        .slice(0, additionalNeeded);
      
      suitableExercises = [...suitableExercises, ...additionalExercises];
      
      console.log(`Final exercise count: ${suitableExercises.length}`);
    }
    
    if (suitableExercises.length === 0) {
      console.warn(`No suitable exercises found for ${muscleGroup} even after fallbacks.`);
      return;
    }
    
    // Rule-based exercise selection and ordering
    let selectedExercises: TSExerciseLibrary[] = [];
    
    // Rule for strength/muscle gain
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
    // Rule for weight loss
    else if (user.fitnessGoal === "weight_loss") {
      const exerciseCount = getRandomInt(
        (aiConfig.exerciseCountRange as { min: number; max: number }).min + 1, // Add extra exercises for weight loss
        (aiConfig.exerciseCountRange as { min: number; max: number }).max + 2
      );
      
      selectedExercises = suitableExercises
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(exerciseCount, suitableExercises.length));
    }
    // Rule for specialized workout types based on their characteristics
    else if (["hiit_strength", "tabata", "circuit_training", "endurance", "active_recovery"].includes(muscleGroup)) {
      // For these specialized types, select more exercises than usual to create variety
      const exerciseCount = getRandomInt(
        (aiConfig.exerciseCountRange as { min: number; max: number }).min + 1,
        (aiConfig.exerciseCountRange as { min: number; max: number }).max + 3
      );
      
      selectedExercises = suitableExercises
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(exerciseCount, suitableExercises.length));
    }
    // Default selection for other goals
    else {
      const exerciseCount = getRandomInt(
        (aiConfig.exerciseCountRange as { min: number; max: number }).min,
        (aiConfig.exerciseCountRange as { min: number; max: number }).max
      );
      
      selectedExercises = suitableExercises
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(exerciseCount, suitableExercises.length));
    }
    
    // Enforce a minimum of at least 2 exercises for any workout (except rest days)
    const minExercises = 2;
    if (selectedExercises.length < minExercises && muscleGroup !== "rest") {
      // Just use as many as we have if we can't meet the minimum
      selectedExercises = suitableExercises.slice(0, Math.min(minExercises, suitableExercises.length));
    }
    
    console.log(`Selected ${selectedExercises.length} exercises for session ${sessionId}`);
    
    // 4. Add each exercise to the session with rule-determined parameters
    for (let i = 0; i < selectedExercises.length; i++) {
      const exercise = selectedExercises[i];
      
      // Rule: Determine if exercise is compound
      const compoundTerms = ['squat', 'deadlift', 'press', 'row', 'bench', 'pull-up', 'pullup', 'chin-up', 'chinup', 'dip'];
      const isCompound = compoundTerms.some(term => 
        exercise.name.toLowerCase().includes(term)
      );
      
      // Rule: Set rep and set ranges based on goal and exercise type
      let sets = 0;
      let reps = 0;
      let restPeriod = 0;
      
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
      else if (user.fitnessGoal.includes("endurance")) {
        sets = getRandomInt(2, 4);
        reps = getRandomInt(15, 25);
        restPeriod = getRandomInt(30, 45); // 30-45 seconds
      }
      // Special handling for workout modalities
      else if (muscleGroup === "hiit_strength") {
        sets = getRandomInt(3, 5);
        reps = getRandomInt(8, 15);
        restPeriod = getRandomInt(20, 40); // Very short rest for HIIT
      }
      else if (muscleGroup === "tabata") {
        sets = getRandomInt(6, 8); // More sets for tabata style
        reps = getRandomInt(12, 20); // Higher reps 
        restPeriod = getRandomInt(10, 20); // Very short rest intervals
      }
      else if (muscleGroup === "circuit_training") {
        sets = getRandomInt(3, 4); // Standard sets for circuit
        reps = getRandomInt(12, 20); // Higher reps
        restPeriod = getRandomInt(15, 30); // Minimal rest between exercises
      }
      else if (muscleGroup === "endurance") {
        sets = getRandomInt(2, 4); // Fewer sets
        reps = getRandomInt(15, 30); // Very high reps for endurance
        restPeriod = getRandomInt(30, 45); // Short-moderate rest
      }
      else if (muscleGroup === "active_recovery") {
        sets = getRandomInt(2, 3); // Fewer sets for recovery
        reps = getRandomInt(10, 15); // Moderate reps
        restPeriod = getRandomInt(30, 60); // Moderate rest
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
      
      console.log(`Added exercise: ${exercise.name} (${sets} sets × ${reps} reps, ${restPeriod}s rest)`);
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
  console.log(`Recording plan generation in history for user ${userId}, plan ${workoutPlanId}`);
  
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
    
  console.log(`Plan generation recorded successfully`);
}