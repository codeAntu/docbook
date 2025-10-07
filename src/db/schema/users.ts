import { boolean, pgTable } from "drizzle-orm/pg-core";
import {
  ID,
  Email,
  Phone,
  Name,
  CreatedAt,
  VerificationCode,
  VerificationExpiry,
} from "./helpers";

export const users = pgTable("users", {
  id: ID,
  name: Name,
  phone: Phone,
  email: Email,
  verified: boolean().default(false).notNull(),
  verificationCode: VerificationCode,
  verificationExpiry: VerificationExpiry,
  createdAt: CreatedAt,
  updatedAt: CreatedAt,
});
