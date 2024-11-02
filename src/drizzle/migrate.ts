import "dotenv/config";

import db, { client } from "./db";
import { migrate } from "drizzle-orm/neon-http/migrator";

console.log("Database_URL:", process.env.DATABASE_URL!);
async function migration() {
  await migrate(db, { migrationsFolder: __dirname + "/migrations" });

  console.log("======== Migrations ended ========");
  process.exit(0);
}

migration();
