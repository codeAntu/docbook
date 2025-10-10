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
  Type,
} from "./helpers";

export const healthcareProviders = pgTable("healthcare_providers", {
  id: ID,
  name: Name.notNull(),
  type: Type,
  address: Address,
  contactNumber: ContactNumber,
  email: Email,
  createdAt: CreatedAt,
});

export const healthcareProvidersRelations = relations(
  healthcareProviders,
  ({ many }) => ({
    doctorSchedules: many(doctorSchedules),
  })
);
