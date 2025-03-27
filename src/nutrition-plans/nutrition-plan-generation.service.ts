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

// Generate specific meal details based on macros and restrictions with Kenyan foods
function generateMealDetails(
  mealTime: string,
  fitnessGoal: string,
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  restrictions: string
): { name: string; description: string; recipe: string } {
  // Base meal templates by time with extensive Kenyan foods
  const mealTemplates: Record<string, Array<{ name: string; description: string; recipe: string; }>> = {
    'breakfast': [
      {
        name: 'Uji Power Breakfast',
        description: 'Protein-enriched traditional porridge to start your day right',
        recipe: 'Cook millet or sorghum uji with milk, add a scoop of protein powder, sliced bananas, and a tablespoon of peanut butter or groundnut paste.'
      },
      {
        name: 'Wimbi Porridge Boost',
        description: 'Finger millet porridge with added protein',
        recipe: 'Cook wimbi (finger millet) flour with milk, add honey, cinnamon, and a scoop of protein powder. Top with sliced local fruits.'
      },
      {
        name: 'Kenyan Egg Dish',
        description: 'Protein-rich eggs with local vegetables',
        recipe: 'Scramble eggs with sukuma wiki (kale), tomatoes, and onions. Serve with a slice of Kenyan brown bread or ugali.'
      },
      {
        name: 'Kenyan Farmer\'s Breakfast',
        description: 'Hearty traditional breakfast with local ingredients',
        recipe: 'Sweet potatoes, arrow roots, and boiled eggs served with a side of steamed local greens and fermented milk.'
      },
      {
        name: 'Chapati Protein Wrap',
        description: 'Traditional flatbread with protein filling',
        recipe: 'Whole grain chapati filled with scrambled eggs, avocado slices, and kachumbari (tomato and onion salad).'
      },
      {
        name: 'Protein Mandazi Breakfast',
        description: 'Traditional Kenyan pastry with protein accompaniment',
        recipe: 'Whole grain mandazi served with protein-enriched yogurt and sliced local fruits like mango or pineapple.'
      },
      {
        name: 'Mbaazi za Nyoyo',
        description: 'Coastal Kenyan pigeon peas breakfast',
        recipe: 'Cook pigeon peas with coconut milk, serve with a boiled egg and a slice of cassava or sweet potato.'
      },
      {
        name: 'Protein-Packed Mahamri',
        description: 'Swahili coconut doughnuts with protein boost',
        recipe: 'Whole grain mahamri served with a protein shake made from milk, local fruits, and protein powder.'
      },
      {
        name: 'Matoke Breakfast Bowl',
        description: 'Plantain-based breakfast with added protein',
        recipe: 'Mashed matoke (plantains) topped with scrambled eggs, avocado slices, and a sprinkle of ground nuts.'
      },
      {
        name: 'Arrow Root Breakfast Plate',
        description: 'Traditional tubers with protein accompaniment',
        recipe: 'Boiled arrow roots (nduma) and sweet potatoes served with fried eggs and steamed sukuma wiki.'
      }
    ],
    'lunch': [
      {
        name: 'Balanced Ugali Plate',
        description: 'Traditional staple with lean protein and vegetables',
        recipe: 'Portion of ugali made from whole maize flour, served with tilapia fish or beef, and a side of sukuma wiki and tomato relish.'
      },
      {
        name: 'Githeri Power Bowl',
        description: 'Protein-rich traditional beans and maize mixture',
        recipe: 'Cook githeri (maize and beans) with carrots, onions, and tomatoes. Add diced lean meat like beef or goat for extra protein.'
      },
      {
        name: 'Kenyan Pilau',
        description: 'Aromatic rice dish with added protein',
        recipe: 'Brown rice pilau cooked with traditional spices, lean beef or chicken, and mixed with peas, carrots, and potatoes.'
      },
      {
        name: 'Matoke with Protein',
        description: 'Balanced meal with plantains and lean protein',
        recipe: 'Mashed matoke (plantains) served with grilled tilapia or beef stew and steamed local vegetables like kunde (cowpeas leaves).'
      },
      {
        name: 'Omena Protein Bowl',
        description: 'Small fish rich in calcium and protein',
        recipe: 'Omena (small lake fish) stewed with tomatoes and onions, served with a side of brown ugali and steamed managu (African nightshade).'
      },
      {
        name: 'Mokimo Energy Plate',
        description: 'Traditional mashed potatoes, corn, and beans dish',
        recipe: 'Mokimo (mashed potatoes, corn, beans, and greens) served with grilled chicken and a side of kachumbari.'
      },
      {
        name: 'Maharagwe ya Nazi',
        description: 'Coastal bean stew with coconut',
        recipe: 'Red kidney beans cooked in coconut milk with spices, served with brown rice and a side of steamed vegetables.'
      },
      {
        name: 'Nyama na Irio',
        description: 'Traditional mashed peas and potatoes with meat',
        recipe: 'Irio (mashed peas, potatoes, and corn) served with lean grilled meat and sautéed terere (amaranth greens).'
      },
      {
        name: 'Kenyan Fish Curry',
        description: 'Local fish in aromatic coconut curry',
        recipe: 'Chunks of fresh tilapia or Nile perch simmered in a curry with coconut milk, tomatoes, and local spices. Served with brown rice or ugali.'
      },
      {
        name: 'Kunde Protein Plate',
        description: 'Cowpea leaves with added protein',
        recipe: 'Kunde (cowpea leaves) cooked with onions, tomatoes and served with a portion of baked tilapia or grilled chicken.'
      },
      {
        name: 'Muthokoi Bowl',
        description: 'Traditional dehulled maize dish with protein',
        recipe: 'Muthokoi (dehulled maize) cooked with beans, vegetables, and lean meat. Seasoned with local herbs and spices.'
      },
      {
        name: 'Mboga Kienyeji Mix',
        description: 'Assorted local vegetables with protein',
        recipe: 'A mix of indigenous vegetables like managu, terere, and saga, sautéed and served with lean beef or chicken and a side of ugali.'
      }
    ],
    'dinner': [
      {
        name: 'Mukimo with Lean Meat',
        description: 'Traditional potato and greens mash with protein',
        recipe: 'Prepare mukimo with potatoes, pumpkin leaves, and corn. Serve with grilled lean beef or chicken and a side of fermented milk (mursik).'
      },
      {
        name: 'Kenyan Fish Stew',
        description: 'Protein-rich fish dish with vegetables',
        recipe: 'Simmer tilapia, Nile perch, or omena with tomatoes, onions, and dhania (coriander). Serve with a small portion of brown rice or sweet potatoes.'
      },
      {
        name: 'Lean Nyama Choma Plate',
        description: 'Traditional grilled meat with balanced sides',
        recipe: 'Grilled lean beef, goat, or chicken with reduced oil. Serve with kachumbari (tomato and onion salad) and a small portion of ugali or whole grain rice.'
      },
      {
        name: 'Vegetable Irio',
        description: 'Traditional mashed peas, potatoes, and corn with added protein',
        recipe: 'Prepare irio with potatoes, peas, corn, and spinach. Serve with grilled chicken breast or fish and a side of sliced avocado.'
      },
      {
        name: 'Kamande Stew',
        description: 'Lentil-based stew with local vegetables',
        recipe: 'Cook kamande (lentils) with onions, tomatoes, and local herbs. Serve with lean beef or chicken and a side of steamed rice.'
      },
      {
        name: 'Kienyeji Chicken Stew',
        description: 'Free-range chicken with local vegetables',
        recipe: 'Slow-cooked kienyeji (free-range) chicken with tomatoes, onions, and local herbs. Serve with a small portion of ugali and steamed sukuma wiki.'
      },
      {
        name: 'Kenyan Coconut Fish',
        description: 'Coastal-style fish with coconut',
        recipe: 'Tilapia or Nile perch cooked in coconut milk with lime juice, onions, tomatoes, and dhania. Serve with brown rice or cassava.'
      },
      {
        name: 'Lean Mbuzi Plate',
        description: 'Goat meat with balanced sides',
        recipe: 'Slow-cooked lean goat meat with onions, tomatoes, and local herbs. Serve with a small portion of ugali and steamed indigenous vegetables.'
      },
      {
        name: 'Mchuzi wa Samaki',
        description: 'Traditional fish curry',
        recipe: 'Fresh fish simmered in a light curry with tomatoes, onions, and local spices. Serve with a side of brown rice and steamed vegetables.'
      },
      {
        name: 'Kenyan Vegetable Coconut Curry',
        description: 'Plant-based curry rich in local vegetables',
        recipe: 'Mix of local vegetables like cabbage, carrots, and sweet potatoes cooked in coconut milk with aromatic spices. Serve with brown rice or ugali.'
      },
      {
        name: 'Terere with Grilled Chicken',
        description: 'Amaranth greens with lean protein',
        recipe: 'Terere (amaranth greens) cooked with onions, tomatoes, and seasoned with local herbs. Served with grilled chicken breast and a small portion of ugali.'
      },
      {
        name: 'Ngwaci na Nyama',
        description: 'Sweet potato and meat combo',
        recipe: 'Roasted sweet potatoes served with lean grilled meat and a side of steamed sukuma wiki or cabbage.'
      }
    ],
    'snack': [
      {
        name: 'Protein Mabuyu',
        description: 'Traditional baobab seed snack with added protein',
        recipe: 'Mix mabuyu (baobab seeds) with a small amount of honey and a scoop of protein powder.'
      },
      {
        name: 'Roasted Groundnuts Mix',
        description: 'Protein-rich traditional snack',
        recipe: 'Mix roasted groundnuts (peanuts) with a small amount of pumpkin seeds and dried fruits like local bananas.'
      },
      {
        name: 'Kenyan Fruit Platter',
        description: 'Fresh local fruits with yogurt',
        recipe: 'Plate of sliced pawpaw (papaya), mango, pineapple, passion fruit, sugar cane, guava, and tree tomato with a side of yogurt for dipping.'
      },
      {
        name: 'Mkate Protein Bites',
        description: 'Kenyan-inspired whole grain protein snack',
        recipe: 'Small bites made from whole grain flour, protein powder, honey, and ground nuts. Bake until firm.'
      },
      {
        name: 'Njugu Karanga',
        description: 'Traditional roasted peanuts',
        recipe: 'Roasted peanuts seasoned with a touch of salt and chili powder. Pair with a small piece of fresh fruit.'
      },
      {
        name: 'Ukwaju Protein Shake',
        description: 'Tamarind-based protein drink',
        recipe: 'Blend tamarind pulp with water, honey, protein powder, and ice for a refreshing, protein-rich drink.'
      },
      {
        name: 'Arrowroot Protein Snack',
        description: 'Traditional tuber with protein dip',
        recipe: 'Boiled arrow root slices served with a dip made from Greek yogurt, protein powder, and a touch of honey.'
      },
      {
        name: 'Wimbi Protein Balls',
        description: 'Finger millet energy bites',
        recipe: 'Balls made from finger millet flour, protein powder, honey, nut butter, and a sprinkle of simsim (sesame seeds).'
      },
      {
        name: 'Madafu Protein Drink',
        description: 'Coconut water with added protein',
        recipe: 'Fresh coconut water mixed with a scoop of protein powder and a squeeze of lime juice.'
      },
      {
        name: 'Kenyan Roasted Corn',
        description: 'Traditional street food with protein',
        recipe: 'Roasted corn cob seasoned with lime and chili powder. Serve with a protein-rich dip or a small portion of roasted meat.'
      }
    ],
    'morning_snack': [
      {
        name: 'Arrow Root with Protein',
        description: 'Traditional nduma (arrow root) with protein dip',
        recipe: 'Boiled arrow root pieces served with a dip made from yogurt, protein powder, and a touch of honey.'
      },
      {
        name: 'Kenyan Mixed Nuts',
        description: 'Energy-boosting local nut mix',
        recipe: 'Mix of groundnuts, pumpkin seeds, simsim (sesame seeds), and a few dried fruits like local bananas or tree tomato.'
      },
      {
        name: 'Sweet Potato Protein Bites',
        description: 'Local sweet potato energy snack',
        recipe: 'Roasted sweet potato cubes with a light sprinkle of cinnamon and a tablespoon of peanut butter.'
      },
      {
        name: 'Ukwaju (Tamarind) Refresher',
        description: 'Traditional tamarind drink with protein',
        recipe: 'Tamarind juice mixed with a scoop of protein powder and a touch of honey. Serve chilled.'
      },
      {
        name: 'Maziwa Mala Cup',
        description: 'Traditional fermented milk snack',
        recipe: 'A cup of mala (fermented milk) with a drizzle of honey and a handful of mixed nuts.'
      },
      {
        name: 'Protein-Packed Kabaazi',
        description: 'Traditional cassava snack with protein',
        recipe: 'Strips of boiled cassava served with a dip made from yogurt, protein powder, and herbs.'
      },
      {
        name: 'Tropical Fruit Skewers',
        description: 'Local fruits with protein dip',
        recipe: 'Skewers of mango, pineapple, and papaya chunks served with a protein-rich yogurt dip.'
      },
      {
        name: 'Simsim Protein Brittle',
        description: 'Traditional sesame snack with protein',
        recipe: 'Sesame seed brittle made with protein powder, honey, and a touch of cinnamon.'
      }
    ],
    'afternoon_snack': [
      {
        name: 'Boiled Maize and Beans',
        description: 'Traditional nutritious snack',
        recipe: 'Boiled maize and beans (mũkande) seasoned with a pinch of salt and chili powder for flavor.'
      },
      {
        name: 'Kachumbari Vegetable Sticks',
        description: 'Fresh vegetable sticks with a protein dip',
        recipe: 'Carrot, cucumber, and bell pepper sticks with 2 tablespoons of homemade lentil or bean dip.'
      },
      {
        name: 'Terere and Yogurt',
        description: 'Local greens with protein',
        recipe: 'Blanched terere (amaranth greens) mixed with plain yogurt and a sprinkle of ground nuts.'
      },
      {
        name: 'Fried Arrowroot Chips',
        description: 'Healthy version of traditional snack',
        recipe: 'Thinly sliced arrowroot, lightly fried or baked with minimal oil, seasoned with herbs. Serve with a protein dip.'
      },
      {
        name: 'Masala Chai Protein Shake',
        description: 'Traditional spiced tea with protein',
        recipe: 'Kenyan masala tea mixed with milk, protein powder, and a touch of honey.'
      },
      {
        name: 'Roasted Simsim and Groundnuts',
        description: 'Traditional seed and nut mix',
        recipe: 'Roasted sesame seeds and groundnuts mixed with a small amount of dried fruits for energy.'
      },
      {
        name: 'Matunda Plate',
        description: 'Seasonal fruit plate with protein',
        recipe: 'Selection of sliced local fruits (like passion fruit, mango, sugar cane, guava) with a side of Greek yogurt.'
      },
      {
        name: 'Mahindi ya Kuchoma',
        description: 'Roasted corn snack with protein',
        recipe: 'Freshly roasted corn on the cob served with a protein-rich side like boiled eggs or yogurt.'
      },
      {
        name: 'Viazi Karai Bites',
        description: 'Healthier version of potato snack',
        recipe: 'Baked potato cubes seasoned with Kenyan spices, served with a protein-rich kachumbari dip.'
      },
      {
        name: 'Ndizi na Nyama',
        description: 'Banana and meat snack',
        recipe: 'Roasted green banana slices with a small portion of leftover grilled lean meat.'
      }
    ],
    'evening_snack': [
      {
        name: 'Mala (Fermented Milk)',
        description: 'Traditional fermented milk with probiotic benefits',
        recipe: 'A cup of mala (fermented milk) with a teaspoon of honey and a handful of mixed nuts.'
      },
      {
        name: 'Protein Uji',
        description: 'Light protein-rich porridge',
        recipe: 'Small portion of millet or sorghum uji mixed with protein powder and a sprinkle of ground nuts.'
      },
      {
        name: 'Cassava Crisps with Egg',
        description: 'Baked cassava with protein',
        recipe: 'Baked cassava crisps with a small boiled egg on the side.'
      },
      {
        name: 'Mursik Protein Mix',
        description: 'Traditional fermented milk with protein boost',
        recipe: 'Small cup of mursik (traditional fermented milk) mixed with a scoop of protein powder.'
      },
      {
        name: 'Sweet Potato Toast',
        description: 'Local alternative to bread toast',
        recipe: 'Sliced and toasted sweet potato topped with avocado and a sprinkle of chia seeds.'
      },
      {
        name: 'Kunde Wrap',
        description: 'Local greens protein wrap',
        recipe: 'Blanched kunde (cowpea leaves) wrapped around sliced boiled egg and avocado.'
      },
      {
        name: 'Njugu Karanga Mix',
        description: 'Traditional mixed nuts evening snack',
        recipe: 'A mix of roasted groundnuts, pumpkin seeds, and dried fruits like banana chips.'
      },
      {
        name: 'Kitumbua Protein Bites',
        description: 'Rice-based coastal snack with protein',
        recipe: 'Small kitumbua (rice cakes) served with a protein-rich coconut dip.'
      },
      {
        name: 'Chai ya Tangawizi Protein',
        description: 'Ginger tea with protein',
        recipe: 'Traditional Kenyan ginger tea mixed with milk and a scoop of protein powder.'
      },
      {
        name: 'Maharagwe Dip with Vegetables',
        description: 'Bean-based protein dip',
        recipe: 'Mashed kidney beans seasoned with local herbs and spices, served with vegetable sticks.'
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
     adjustedMeal.recipe = adjustedMeal.recipe
       .replace(/beef|goat|chicken|fish|tilapia|perch|omena|nyama choma|mbuzi|kienyeji chicken|samaki/, 'plant-based proteins like beans, lentils, njahi (black beans), ndengu (green grams), or kunde (cowpeas)');
   }
   
   if (restrictions.toLowerCase().includes('vegan')) {
     adjustedMeal.name = `Vegan ${adjustedMeal.name}`;
     adjustedMeal.recipe = adjustedMeal.recipe
       .replace(/beef|goat|chicken|fish|tilapia|perch|omena|nyama choma|mbuzi|kienyeji chicken|samaki/, 'plant-based proteins like beans, lentils, njahi (black beans), ndengu (green grams), or kunde (cowpeas)')
       .replace(/yogurt|mala|fermented milk|mursik/, 'coconut yogurt or fermented plant milk')
       .replace(/milk/, 'plant milk like coconut milk, soy milk, or uji without milk')
       .replace(/egg/, 'scrambled tofu or mashed beans');
   }
   
   if (restrictions.toLowerCase().includes('gluten')) {
     adjustedMeal.name = `Gluten-Free ${adjustedMeal.name}`;
     adjustedMeal.recipe = adjustedMeal.recipe
       .replace(/brown bread|bread/, 'gluten-free cassava bread or rice cake')
       .replace(/whole grain mandazi/, 'gluten-free mandazi made with cassava or sorghum flour')
       .replace(/whole grain flour/, 'gluten-free alternatives like cassava, sorghum, or millet flour')
       .replace(/chapati/, 'gluten-free chapati made with cassava or millet flour')
       .replace(/mahamri/, 'gluten-free mahamri made with cassava or rice flour')
       .replace(/wheat/, 'gluten-free flour alternatives like cassava, millet, or sorghum');
   }
   
   if (restrictions.toLowerCase().includes('lactose') || restrictions.toLowerCase().includes('dairy')) {
     adjustedMeal.name = `Dairy-Free ${adjustedMeal.name}`;
     adjustedMeal.recipe = adjustedMeal.recipe
       .replace(/yogurt|mala|fermented milk|mursik/, 'coconut yogurt or fermented plant-based alternatives')
       .replace(/milk/, 'coconut milk, soy milk, or other plant-based milk');
   }
   
   // Additional common Kenyan dietary restrictions
   if (restrictions.toLowerCase().includes('nuts') || restrictions.toLowerCase().includes('peanut')) {
     adjustedMeal.name = `Nut-Free ${adjustedMeal.name}`;
     adjustedMeal.recipe = adjustedMeal.recipe
       .replace(/groundnuts|njugu karanga|peanut|peanuts|nut butter/, 'sunflower seeds or roasted pumpkin seeds')
       .replace(/mixed nuts/, 'mixed seeds like pumpkin, sunflower, and chia seeds');
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