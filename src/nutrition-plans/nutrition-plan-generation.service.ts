// nutrition-plans/nutrition-plan-generation.service.ts
import { eq } from "drizzle-orm";
import db from "../drizzle/db";
import { 
  NutritionPlansTable, 
  MealPlansTable,
  UsersTable,
  AiPlansHistoryTable,
  TSUser
} from "../drizzle/schema";

// Utility function to calculate BMI
const calculateBMI = (heightCm: number, weightKg: number): number => {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
};

// Function to calculate age from date of birth
const calculateAge = (dateOfBirth: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
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

export const nutritionPlanGenerationService = {
  // Main function to generate a nutrition plan for a user
  generateNutritionPlan: async (userId: number): Promise<boolean> => {
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
      
      // 2. Calculate daily calorie needs and macronutrients
      const nutritionPlan = calculateNutritionNeeds(user);
      
      if (!nutritionPlan) {
        console.error(`Failed to calculate nutrition needs for user ${userId}`);
        return false;
      }
      
      // 3. Create nutrition plan in database
      const [createdPlan] = await db
        .insert(NutritionPlansTable)
        .values({
          userId: user.userId,
          goal: user.fitnessGoal,
          dailyCalories: nutritionPlan.dailyCalories,
          proteinGrams: nutritionPlan.proteinGrams,
          carbsGrams: nutritionPlan.carbsGrams,
          fatGrams: nutritionPlan.fatGrams,
          mealsPerDay: nutritionPlan.mealsPerDay,
          isAiGenerated: true,
          restrictions: user.dietaryRestrictions || "None"
        })
        .returning();
      
      if (!createdPlan || !createdPlan.nutritionPlanId) {
        console.error(`Failed to create nutrition plan for user ${userId}`);
        return false;
      }
      
      // 4. Generate meal plans
      await generateMealPlans(createdPlan.nutritionPlanId, nutritionPlan, user);
      
      // 5. Record in AI plan history if needed
      await recordNutritionPlanGeneration(userId, createdPlan.nutritionPlanId);
      
      return true;
    } catch (error) {
      console.error("Error generating nutrition plan:", error);
      return false;
    }
  }
};

// Rule-based calorie and macronutrient calculation
function calculateNutritionNeeds(user: TSUser) {
  // Parse height and weight from strings to numbers
  const weight = parseFloat(user.weight);
  const height = parseFloat(user.height);
  const dateOfBirth = new Date(user.dateOfBirth);
  const age = calculateAge(dateOfBirth);
  
  let bmr = 0;
  
  // Rule 1: Calculate BMR based on gender using Mifflin-St Jeor Equation
  if (user.gender.toLowerCase() === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  
  // Rule 2: Apply activity level multiplier
  let activityMultiplier = 1.2; // Sedentary default
  
  if (user.activityLevel.includes('lightly')) {
    activityMultiplier = 1.375;
  } else if (user.activityLevel.includes('moderate')) {
    activityMultiplier = 1.55;
  } else if (user.activityLevel.includes('very')) {
    activityMultiplier = 1.725;
  } else if (user.activityLevel.includes('extra')) {
    activityMultiplier = 1.9;
  }
  
  let tdee = Math.round(bmr * activityMultiplier); // Total Daily Energy Expenditure
  
  // Rule 3: Adjust calories based on fitness goal
  let dailyCalories = tdee;
  let proteinMultiplier = 0;
  let fatMultiplier = 0;
  let carbsPercentage = 0;
  let mealsPerDay = 3; // Default
  
  if (user.fitnessGoal === 'weight_loss') {
    // 20% caloric deficit for weight loss
    dailyCalories = Math.round(tdee * 0.8);
    proteinMultiplier = 2.0; // 2g protein per kg body weight
    fatMultiplier = 0.8; // 0.8g fat per kg body weight
    carbsPercentage = 40; // Remaining calories from carbs
    mealsPerDay = 4; // More frequent smaller meals
  } 
  else if (user.fitnessGoal === 'muscle_gain') {
    // 10% caloric surplus for muscle gain
    dailyCalories = Math.round(tdee * 1.1);
    proteinMultiplier = 2.2; // 2.2g protein per kg body weight
    fatMultiplier = 1.0; // 1g fat per kg body weight
    carbsPercentage = 50; // Higher carbs for muscle gain
    mealsPerDay = 5; // More meals for more nutrients
  }
  else if (user.fitnessGoal.includes('strength')) {
    // Similar to muscle gain but with more calories
    dailyCalories = Math.round(tdee * 1.15);
    proteinMultiplier = 2.0;
    fatMultiplier = 1.0;
    carbsPercentage = 50;
    mealsPerDay = 5;
  }
  else if (user.fitnessGoal.includes('endurance')) {
    // Focus on carbs for endurance
    dailyCalories = Math.round(tdee * 1.05);
    proteinMultiplier = 1.6;
    fatMultiplier = 0.8;
    carbsPercentage = 60; // Higher carbs for endurance
    mealsPerDay = 5; // More frequent meals for energy
  }
  else { // maintenance or other goals
    dailyCalories = tdee;
    proteinMultiplier = 1.6;
    fatMultiplier = 0.8;
    carbsPercentage = 50;
    mealsPerDay = 3;
  }
  
  // Rule 4: Calculate macronutrients
  // Protein: 4 calories per gram
  const proteinGrams = Math.round(weight * proteinMultiplier);
  const proteinCalories = proteinGrams * 4;
  
  // Fat: 9 calories per gram
  const fatGrams = Math.round(weight * fatMultiplier);
  const fatCalories = fatGrams * 9;
  
  // Remaining calories from carbs (4 calories per gram)
  const remainingCalories = dailyCalories - proteinCalories - fatCalories;
  const carbsGrams = Math.max(20, Math.round(remainingCalories / 4)); // Minimum 20g carbs
  
  // Rule 5: Adjust based on experience level
  if (user.experienceLevel === 'beginner') {
    // Simplify plan for beginners with fewer meals
    mealsPerDay = Math.min(mealsPerDay, 4);
  } else if (user.experienceLevel === 'advanced') {
    // More precise nutrition for advanced users
    mealsPerDay = Math.max(mealsPerDay, 4);
  }
  
  // Return nutrition plan parameters
  return {
    dailyCalories,
    proteinGrams,
    carbsGrams,
    fatGrams,
    mealsPerDay
  };
}

// Generate meal plans for the nutrition plan
async function generateMealPlans(
  nutritionPlanId: number, 
  nutritionPlan: {
    dailyCalories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    mealsPerDay: number;
  }, 
  user: TSUser
) {
  try {
    // Generate 7 days of meal plans (1 week)
    for (let day = 1; day <= 7; day++) {
      // Determine meal distribution based on number of meals per day
      const mealDistribution = getMealDistribution(nutritionPlan.mealsPerDay);
      
      // For each meal of the day
      for (const [mealTime, percentage] of Object.entries(mealDistribution)) {
        // Calculate this meal's nutrition values
        const mealCalories = Math.round(nutritionPlan.dailyCalories * (percentage / 100));
        const mealProtein = Math.round(nutritionPlan.proteinGrams * (percentage / 100));
        const mealCarbs = Math.round(nutritionPlan.carbsGrams * (percentage / 100));
        const mealFat = Math.round(nutritionPlan.fatGrams * (percentage / 100));
        
        // Generate meal details
        const mealDetails = generateMealDetails(
          mealTime, 
          user.fitnessGoal, 
          mealCalories, 
          mealProtein, 
          mealCarbs, 
          mealFat,
          user.dietaryRestrictions || "None"
        );
        
        // Create meal plan record
        await db
          .insert(MealPlansTable)
          .values({
            nutritionPlanId,
            dayNumber: day,
            mealTime: mealTime,
            name: mealDetails.name,
            description: mealDetails.description,
            calories: mealCalories,
            protein: mealProtein,
            carbs: mealCarbs,
            fat: mealFat,
            recipe: mealDetails.recipe
          });
      }
    }
  } catch (error) {
    console.error("Error generating meal plans:", error);
  }
}

// Helper function to distribute calories across different meals
function getMealDistribution(mealsPerDay: number): Record<string, number> {
  if (mealsPerDay === 3) {
    return {
      'breakfast': 30,
      'lunch': 40,
      'dinner': 30
    };
  } else if (mealsPerDay === 4) {
    return {
      'breakfast': 25,
      'lunch': 30,
      'snack': 15,
      'dinner': 30
    };
  } else if (mealsPerDay === 5) {
    return {
      'breakfast': 20,
      'morning_snack': 10,
      'lunch': 30,
      'afternoon_snack': 10,
      'dinner': 30
    };
  } else if (mealsPerDay === 6) {
    return {
      'breakfast': 20,
      'morning_snack': 10,
      'lunch': 25,
      'afternoon_snack': 10,
      'dinner': 25,
      'evening_snack': 10
    };
  } else {
    // Default to 3 meals
    return {
      'breakfast': 30,
      'lunch': 40,
      'dinner': 30
    };
  }
}

// Generate specific meal details based on macros and restrictions
function generateMealDetails(
  mealTime: string,
  fitnessGoal: string,
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  restrictions: string
): { name: string; description: string; recipe: string } {
  // Base meal templates by time
  const mealTemplates: Record<string, Array<{ name: string; description: string; recipe: string; }>> = {
    'breakfast': [
      {
        name: 'High Protein Breakfast Bowl',
        description: 'Protein-packed breakfast to start your day right',
        recipe: 'Mix Greek yogurt, protein powder, berries, and nuts. Top with chia seeds and a drizzle of honey.'
      },
      {
        name: 'Power Oatmeal',
        description: 'Complex carbs with added protein for sustained energy',
        recipe: 'Cook rolled oats with milk, add a scoop of protein powder, banana slices, and a tablespoon of peanut butter.'
      },
      {
        name: 'Veggie Egg Scramble',
        description: 'Protein-rich eggs with vegetables for micronutrients',
        recipe: 'Scramble eggs with spinach, tomatoes, and bell peppers. Serve with a slice of whole grain toast.'
      }
    ],
    'lunch': [
      {
        name: 'Lean Protein Bowl',
        description: 'Balanced meal with lean protein and complex carbs',
        recipe: 'Grilled chicken breast, brown rice, steamed broccoli, and avocado slices. Season with olive oil and herbs.'
      },
      {
        name: 'Power Salad',
        description: 'Nutrient-dense salad with lean protein',
        recipe: 'Mix spinach, grilled chicken, quinoa, cherry tomatoes, cucumber, and bell peppers. Dress with olive oil and lemon juice.'
      },
      {
        name: 'Whole Grain Wrap',
        description: 'Portable balanced meal with whole grains',
        recipe: 'Whole grain wrap filled with turkey breast, hummus, spinach, grated carrots, and a sprinkle of feta cheese.'
      }
    ],
    'dinner': [
      {
        name: 'Baked Fish with Vegetables',
        description: 'Lean protein with fiber-rich vegetables',
        recipe: 'Bake salmon with lemon, serve with roasted sweet potatoes and steamed asparagus.'
      },
      {
        name: 'Lean Stir Fry',
        description: 'High protein stir fry with plenty of vegetables',
        recipe: 'Stir fry lean beef strips with broccoli, snap peas, bell peppers, and carrots. Serve over brown rice or quinoa.'
      },
      {
        name: 'Hearty Protein Bowl',
        description: 'Complete meal with balanced macronutrients',
        recipe: 'Combine grilled chicken, black beans, brown rice, roasted vegetables, avocado, and a dollop of Greek yogurt.'
      }
    ],
    'snack': [
      {
        name: 'Protein Smoothie',
        description: 'Quick protein boost',
        recipe: 'Blend protein powder, banana, spinach, almond milk, and a tablespoon of almond butter.'
      },
      {
        name: 'Greek Yogurt Parfait',
        description: 'Protein-rich snack with healthy carbs',
        recipe: 'Layer Greek yogurt with berries and a sprinkle of granola.'
      },
      {
        name: 'Protein Energy Bites',
        description: 'Portable balanced snack',
        recipe: 'Mix oats, protein powder, peanut butter, honey, and mini chocolate chips. Roll into balls and refrigerate.'
      }
    ],
    'morning_snack': [
      {
        name: 'Fruit and Nuts',
        description: 'Simple energizing snack',
        recipe: 'An apple with a small handful of almonds.'
      },
      {
        name: 'Protein Bar',
        description: 'Convenient protein source',
        recipe: 'Homemade protein bar with oats, protein powder, honey, and dried fruits.'
      }
    ],
    'afternoon_snack': [
      {
        name: 'Vegetable Sticks with Hummus',
        description: 'Crunchy low-calorie snack with protein',
        recipe: 'Carrot, celery, and bell pepper sticks with 2 tablespoons of hummus.'
      },
      {
        name: 'Cottage Cheese with Fruit',
        description: 'Protein-rich snack with natural sugars',
        recipe: 'Cottage cheese topped with pineapple chunks or berries.'
      }
    ],
    'evening_snack': [
      {
        name: 'Casein Protein Shake',
        description: 'Slow-digesting protein for overnight recovery',
        recipe: 'Mix casein protein powder with almond milk and a teaspoon of almond butter.'
      },
      {
        name: 'Greek Yogurt with Honey',
        description: 'Light protein-rich snack',
        recipe: 'Greek yogurt with a teaspoon of honey and a sprinkle of cinnamon.'
      }
    ]
  };
  
  // Default to snack if the meal time isn't specifically defined
  const availableMeals = mealTemplates[mealTime] || mealTemplates['snack'];
  
  // Randomly select a meal template
  const mealIndex = getRandomInt(0, availableMeals.length - 1);
  const selectedMeal = availableMeals[mealIndex];
  
  // Adjust for dietary restrictions
  let adjustedMeal = { ...selectedMeal };
  
  if (restrictions && restrictions.toLowerCase() !== 'none') {
    // Handle common dietary restrictions
    if (restrictions.toLowerCase().includes('vegetarian')) {
      adjustedMeal.name = `Vegetarian ${adjustedMeal.name}`;
      adjustedMeal.recipe = adjustedMeal.recipe.replace(/chicken|beef|turkey|fish|salmon/, 'tofu or tempeh');
    }
    
    if (restrictions.toLowerCase().includes('vegan')) {
      adjustedMeal.name = `Vegan ${adjustedMeal.name}`;
      adjustedMeal.recipe = adjustedMeal.recipe
        .replace(/chicken|beef|turkey|fish|salmon/, 'tofu or tempeh')
        .replace(/greek yogurt|yogurt/, 'coconut yogurt')
        .replace(/milk/, 'almond milk')
        .replace(/cheese/, 'nutritional yeast');
    }
    
    if (restrictions.toLowerCase().includes('gluten')) {
      adjustedMeal.name = `Gluten-Free ${adjustedMeal.name}`;
      adjustedMeal.recipe = adjustedMeal.recipe
        .replace(/whole grain bread|bread/, 'gluten-free bread')
        .replace(/whole grain wrap|wrap/, 'gluten-free wrap')
        .replace(/oats/, 'gluten-free oats');
    }
    
    if (restrictions.toLowerCase().includes('lactose') || restrictions.toLowerCase().includes('dairy')) {
      adjustedMeal.name = `Dairy-Free ${adjustedMeal.name}`;
      adjustedMeal.recipe = adjustedMeal.recipe
        .replace(/greek yogurt|yogurt/, 'coconut yogurt')
        .replace(/milk/, 'almond milk')
        .replace(/cheese/, 'dairy-free cheese');
    }
  }
  
  // Customize based on fitness goal
  if (fitnessGoal === 'weight_loss') {
    adjustedMeal.description = `${adjustedMeal.description} - Calorie-controlled for weight management.`;
  } else if (fitnessGoal === 'muscle_gain') {
    adjustedMeal.description = `${adjustedMeal.description} - Protein-rich to support muscle growth.`;
  } else if (fitnessGoal.includes('strength')) {
    adjustedMeal.description = `${adjustedMeal.description} - Balanced nutrition for strength development.`;
  } else if (fitnessGoal.includes('endurance')) {
    adjustedMeal.description = `${adjustedMeal.description} - Carb-focused for endurance training.`;
  }
  
  // Add macronutrient information to the description
  adjustedMeal.description = `${adjustedMeal.description} Contains approximately ${calories} calories, ${protein}g protein, ${carbs}g carbs, and ${fat}g fat.`;
  
  return adjustedMeal;
}

// Record nutrition plan generation in history
async function recordNutritionPlanGeneration(
  userId: number, 
  nutritionPlanId: number
): Promise<void> {
  await db
    .insert(AiPlansHistoryTable)
    .values({
      userId,
      nutritionPlanId,
      userInputs: JSON.stringify({
        timestamp: new Date().toISOString(),
        type: 'nutrition_plan'
      })
    });
}