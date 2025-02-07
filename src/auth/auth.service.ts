// auth.service.ts
import { UsersTable } from "../drizzle/schema";
import db from "../drizzle/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export const createAuthUserService = async (userId: number, hashedPassword: string) => {
  await db
    .update(UsersTable)
    .set({ password: hashedPassword })
    .where(eq(UsersTable.userId, userId))
    .execute();
};

export const userLoginService = async (email: string, password: string) => {
  const user = await db.query.UsersTable.findFirst({
    where: eq(UsersTable.email, email),
  });

  if (!user) return null;

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) return null;

  return user;
};
