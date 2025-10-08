import { eq } from "drizzle-orm";
import { db } from "../db/db";
import { doctors, users } from "../db/schema";

export type UserType = "user" | "doctor";

export interface PhoneCheckResult {
  exists: boolean;
  userType?: UserType;
  message?: string;
}

export async function checkPhoneExists(
  phone: string
): Promise<PhoneCheckResult> {
  try {
    // Check in users table
    const existingUser = await db
      .select({ id: users.id, phone: users.phone })
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    if (existingUser.length) {
      return {
        exists: true,
        userType: "user",
        message: "Phone number already registered as a user",
      };
    }

    // Check in doctors table
    const existingDoctor = await db
      .select({ id: doctors.id, phone: doctors.phone })
      .from(doctors)
      .where(eq(doctors.phone, phone))
      .limit(1);

    if (existingDoctor.length) {
      return {
        exists: true,
        userType: "doctor",
        message: "Phone number already registered as a doctor",
      };
    }

    return {
      exists: false,
      message: "Phone number is available for registration",
    };
  } catch (error) {
    console.error("Error checking phone existence:", error);
    throw new Error("Failed to check phone number availability");
  }
}

export async function validatePhoneAvailable(
  phone: string,
  excludeType?: UserType
): Promise<void> {
  const result = await checkPhoneExists(phone);

  if (result.exists && result.userType !== excludeType) {
    throw new Error(result.message || "Phone number already exists");
  }
}

export async function notInUser(phone: string): Promise<boolean> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);
  return !result.length;
}

export async function notInDoc(phone: string): Promise<boolean> {
  const result = await db
    .select()
    .from(doctors)
    .where(eq(doctors.phone, phone))
    .limit(1);
  return !result.length;
}

export async function canBeUser(phone: string): Promise<boolean> {
  return await notInDoc(phone);
}


export async function canBeDoctor(phone: string): Promise<boolean> {
  return await notInUser(phone);
}