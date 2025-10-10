import { relations } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";
import { doctorSchedules } from "./doctorSchedule";
import {
  Address,
  ContactNumber,
  CreatedAt,
  Email,
  ID,
  Name,
  Password,
  Type,
} from "./helpers";

export const healthcareProviders = pgTable("healthcare_providers", {
  id: ID,
  name: Name.notNull(),
  email: Email.notNull(),
  type: Type,
  address: Address,
  contactNumber: ContactNumber,
  password: Password,
  createdAt: CreatedAt,
});

export const healthcareProvidersRelations = relations(
  healthcareProviders,
  ({ many }) => ({
    doctorSchedules: many(doctorSchedules),
  })
);
