import { pgTable } from "drizzle-orm/pg-core";
import {
  ID,
  Phone,
  VerificationCode,
  VerificationExpiry
} from "./helpers";

// Temporary users table for storing verification codes

export const TempUser = pgTable("temp_users", {
  id: ID,
  phone: Phone.unique(),
  verificationCode: VerificationCode,
  verificationExpiry: VerificationExpiry,
});
