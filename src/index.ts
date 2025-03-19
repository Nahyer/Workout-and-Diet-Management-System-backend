import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import "dotenv/config";
import { userRouter } from "./users/users.router";
import { exerciseLibraryRouter } from "./exercise-library/exercise-library.router"
import { workoutPlanRouter } from "./workout-plans/workout-plans.router"
import { workoutSessionRouter } from "./workout-sessions/workout-sessions.router";
import { workoutExerciseRouter } from "./workout-exercises/workout-exercises.router";
import { nutritionPlanRouter } from "./nutrition-plans/nutrition-plans.router";
import { mealPlansRouter } from "./meal-plans/meal-plans.router";
import { progressTrackingRouter } from "./progress-tracking/progress-tracking.router";
import { workoutLogsRouter } from "./workout-logs/workout-logs.router";
import { exerciseLogsRouter } from "./exercise-logs/exercise-logs.router";
import { aiPlansHistoryRouter } from "./ai-plans-history/ai-plans-history.router";
import { aiConfigurationRouter } from "./ai-configuration/ai-configuration.router";
import { supportTicketRouter } from "./support-tickets/support-tickets.router";
import { authRouter } from "./auth/auth.router";

const app = new Hono();

app.use("*", cors({
  origin: "http://localhost:3000",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

app.get("/", (c) => {
  return c.text("Welcome to Workout and Diet Management System API!");
});

app.route("/api", userRouter);
app.route("/api", exerciseLibraryRouter );
app.route("/api", workoutPlanRouter);
app.route("/api", workoutSessionRouter);
app.route("/api", workoutExerciseRouter);
app.route("/api", nutritionPlanRouter);
app.route("/api", mealPlansRouter);
app.route("/api", progressTrackingRouter);
app.route("/api", workoutLogsRouter);
app.route("/api", exerciseLogsRouter);
app.route("/api", aiPlansHistoryRouter);
app.route("/api", aiConfigurationRouter);
app.route("/api", supportTicketRouter);
app.route("/api/auth", authRouter);



console.log(`Server is running on port ${process.env.PORT}`);


serve({
  fetch: app.fetch,
  port: Number(process.env.PORT) || 8000,
});