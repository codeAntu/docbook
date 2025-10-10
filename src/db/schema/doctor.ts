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
} from "./helpers";

export const doctors = pgTable("doctors", {
  id: ID,
  name: Name.notNull(),
  email: varchar("email").unique(),
  specialization: textField("specialization"),
  contactNumber: ContactNumber,
  createdAt: CreatedAt,
});

export const doctorsRelations = relations(doctors, ({ many }) => ({
  schedules: many(doctorSchedules),
}));
