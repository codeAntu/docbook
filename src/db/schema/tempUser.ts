import { pgEnum, pgTable } from "drizzle-orm/pg-core";
import { ID, Phone, VerificationCode, VerificationExpiry } from "./helpers";

// Temporary users table for storing verification codes
export const userTypeEnum = pgEnum("user_type", ["user", "doctor"]);

export const TempUser = pgTable("temp_users", {
  id: ID,
  phone: Phone.unique(),
  userType: userTypeEnum(),
  verificationCode: VerificationCode,
  verificationExpiry: VerificationExpiry,
});
