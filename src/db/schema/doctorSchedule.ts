// This schedule system is normalized into three schemas:
// 1. doctorSchedules: main schedule record (doctor, hp, type)
// 2. weeklyScheduleDays: days of week for weekly schedules (with time/booking info)
// 3. monthlyScheduleDays: days of month for monthly schedules (with time/booking info)
// This avoids redundant data and allows flexible assignment of days and times.

import { relations } from "drizzle-orm";
import { integer, pgTable } from "drizzle-orm/pg-core";
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
  ScheduleStatus,
  ScheduleType,
  StartTime,
  uuidRef,
} from "./helpers";

export const doctorSchedules = pgTable("doctor_schedules", {
  id: ID,
  hpId: uuidRef("hp_id").references(() => healthcareProviders.id),
  doctorId: uuidRef("doctor_id").references(() => doctors.id),
  scheduleType: ScheduleType, // "Daily", "Weekly", "Monthly"

  // Bitmask for quick lookup of available days (0 = not available, 1 = available)
  // For weekly: bit 0 = Sunday, bit 1 = Monday, ..., bit 6 = Saturday
  // Example: 0b0000011 = 3 means Sunday + Monday available
  weekDaysMask: integer("week_days_mask").default(0),

  // For monthly: bit 0 = day 1, bit 1 = day 2, ..., bit 30 = day 31
  // Example: 0b1000000000000001 = 32769 means day 1 + day 16 available
  monthDaysMask: integer("month_days_mask").default(0),
  scheduleStatus: ScheduleStatus("schedule_status").default("active"),
  createdAt: CreatedAt,
});

export const weeklyScheduleDays = pgTable("weekly_schedule_days", {
  id: ID,
  scheduleId: uuidRef("schedule_id").references(() => doctorSchedules.id),
  dayOfWeek: DayOfWeek, // 0-6
  startTime: StartTime,
  endTime: EndTime,
  maxBookings: MaxBookings,
});

export const monthlyScheduleDays = pgTable("monthly_schedule_days", {
  id: ID,
  scheduleId: uuidRef("schedule_id").references(() => doctorSchedules.id),
  dayOfMonth: DayOfMonth, // 1-31
  startTime: StartTime,
  endTime: EndTime,
  maxBookings: MaxBookings,
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
