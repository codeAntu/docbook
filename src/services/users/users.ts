import { eq } from "drizzle-orm";
import { db } from "../../db/db";
import { users } from "../../db/schema/users";

export async function findUserByNumber(number: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.phone, number))
    .limit(1);
  return user[0];
}
