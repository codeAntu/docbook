import { relations } from "drizzle-orm";
import { pgTable, varchar } from "drizzle-orm/pg-core";
import { doctorSchedules } from "./doctorSchedule";
import { CreatedAt, Email, Phone, Specialty } from "./helpers";

export const doctors = pgTable("doctors", {
  doctorName: varchar("doctor_name", { length: 100 }).primaryKey(),
  specialization: Specialty,
  contactNumber: Phone,
  email: Email,
  createdAt: CreatedAt,
});

export const doctorsRelations = relations(doctors, ({ many }) => ({
  schedules: many(doctorSchedules),
}));
