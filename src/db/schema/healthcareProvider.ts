import { relations } from "drizzle-orm";
import { pgTable, varchar } from "drizzle-orm/pg-core";
import { doctorSchedules } from "./doctorSchedule";
import { CreatedAt, Email, Phone } from "./helpers";

export const healthcareProviders = pgTable("healthcare_providers", {
  hpName: varchar("hp_name", { length: 100 }).primaryKey(),
  hpType: varchar("hp_type", { length: 50 }),
  address: varchar("address", { length: 200 }),
  contactNumber: Phone,
  email: Email,
  createdAt: CreatedAt,
});

export const healthcareProvidersRelations = relations(
  healthcareProviders,
  ({ many }) => ({
    doctorSchedules: many(doctorSchedules),
  })
);
