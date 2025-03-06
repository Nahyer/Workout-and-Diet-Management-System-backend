// auth/auth.controller.ts
import "dotenv/config";
import { Context } from "hono";
import { createAuthUserService, userLoginService } from "./auth.service";
import bcrypt from "bcrypt";
import { sign } from "hono/jwt";
import { userService } from "../users/users.service";
import { aiPlanGenerationService } from "../ai-plans-history/ai-plan-generation.service";
import { nutritionPlanGenerationService } from "../nutrition-plans/nutrition-plan-generation.service";

export const registerUser = async (c: Context) => {
  try {
    const userData = await c.req.json();
    const { password, ...userInfo } = userData;

    // Validate date format
    const dateOfBirth = new Date(userInfo.dateOfBirth);
    if (isNaN(dateOfBirth.getTime())) {
      return c.json({ error: "Invalid date format for date of birth" }, 400);
    }

    // Convert height and weight to decimal
    const height = parseFloat(userInfo.height);
    const weight = parseFloat(userInfo.weight);
    if (isNaN(height) || isNaN(weight)) {
      return c.json({ error: "Invalid height or weight values" }, 400);
    }

    // Hash the password before creating the user
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user with the hashed password
    const createdUser = await userService.create({
      ...userInfo,
      height,
      weight,
      dateOfBirth,
      password: hashedPassword,
    });

    // Initialize plan generation results
    let workoutPlanGenerated = false;
    let nutritionPlanGenerated = false;

    // If user was successfully created and has a userId, generate plans
    if (createdUser && typeof createdUser.userId === 'number') {
      try {
        // Generate AI workout plan using rule-based logic
        workoutPlanGenerated = await aiPlanGenerationService.generateWorkoutPlan(createdUser.userId);
        
        // Generate nutrition plan
        nutritionPlanGenerated = await nutritionPlanGenerationService.generateNutritionPlan(createdUser.userId);
      } catch (planError) {
        // Log the error but don't fail the registration process
        console.error("Error generating plans:", planError);
      }
    }

    // Return success response with user data and plan generation status
    return c.json({ 
      message: "User registered successfully", 
      user: {
        ...createdUser,
        password: undefined 
      },
      workoutPlanGenerated,
      nutritionPlanGenerated
    }, 201);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const loginUser = async (c: Context) => {
  try {
    const { email, password } = await c.req.json();
    const userExist = await userLoginService(email, password);
    
    if (!userExist) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const payload = {
      sub: userExist.userId.toString(),
      role: userExist.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 180, // 3 hours
    };
    
    const secret = process.env.JWT_SECRET as string;
    const token = await sign(payload, secret);

    return c.json({ 
      token, 
      user: {
        ...userExist,
        password: undefined
      }
    }, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};