import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../../db/db";
import { healthcareProviders } from "../../db/schema";

export async function isNewHp(email: string): Promise<boolean> {
  return db
    .select()
    .from(healthcareProviders)
    .where(eq(healthcareProviders.email, email))
    .limit(1)
    .then((result) => result.length === 0);
}

export async function createHp({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await db
    .insert(healthcareProviders)
    .values({
      name,
      email,
      password: hashedPassword,
    })
    .returning();
  return result[0];
}

export async function findHpByEmail(email: string) {
  return db
    .select()
    .from(healthcareProviders)
    .where(eq(healthcareProviders.email, email))
    .limit(1)
    .then((result) => (result.length === 0 ? null : result[0]));
}
