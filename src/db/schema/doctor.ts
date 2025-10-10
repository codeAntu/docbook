import { relations } from "drizzle-orm";
import { pgTable, varchar } from "drizzle-orm/pg-core";
import { doctorSchedules } from "./doctorSchedule";
import {
  ContactNumber,
  CreatedAt,
  Email,
  ID,
  Name,
  textField,
  uuidRef,
} from "./helpers";
import { healthcareProviders } from "./healthcareProvider";

export const doctors = pgTable("doctors", {
  id: ID,
  name: Name.notNull(),
  email: varchar("email"),
  specialization: textField("specialization").notNull(),
  contactNumber: ContactNumber,
  hpId: uuidRef("hp_id")
    .references(() => healthcareProviders.id)
    .notNull(),
  createdAt: CreatedAt,
});

export const doctorsRelations = relations(doctors, ({ many }) => ({
  schedules: many(doctorSchedules),
}));
