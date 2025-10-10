import { relations } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";
import { doctors } from "./doctor";
import { healthcareProviders } from "./healthcareProvider";
import {
  CreatedAt,
  DayOfMonth,
  DayOfWeek,
  EndTime,
  ID,
  IsActive,
  MaxBookings,
  ScheduleType,
  StartTime,
  uuidRef,
} from "./helpers";

export const doctorSchedules = pgTable("doctor_schedules", {
  id: ID,
  hpId: uuidRef("hp_id").references(() => healthcareProviders.id),
  doctorId: uuidRef("doctor_id").references(() => doctors.id),
  scheduleType: ScheduleType,
  dayOfWeek: DayOfWeek,
  dayOfMonth: DayOfMonth,
  startTime: StartTime,
  endTime: EndTime,
  maxBookings: MaxBookings,
  isActive: IsActive,
  createdAt: CreatedAt,
});

export const doctorSchedulesRelations = relations(
  doctorSchedules,
  ({ one }) => ({
    healthcareProvider: one(healthcareProviders, {
      fields: [doctorSchedules.hpId],
      references: [healthcareProviders.id],
    }),
    doctor: one(doctors, {
      fields: [doctorSchedules.doctorId],
      references: [doctors.id],
    }),
  })
);
