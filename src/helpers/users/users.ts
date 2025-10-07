import { and, eq } from "drizzle-orm";
import { db } from "../../db/db";
import { users } from "../../db/schema/users";

export async function createUser(number: string, name: string) {
  const user = await db
    .insert(users)
    .values({ name: name, phone: number })
    .returning();
  return user;
}

export async function findUserByNumber(number: string) {
  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.phone, number), eq(users.verified, true)))
    .limit(1);
  return user[0];
}
