import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  pgTable,
  serial,
  time,
  varchar,
} from "drizzle-orm/pg-core";
import { doctors } from "./doctor";
import { healthcareProviders } from "./healthcareProvider";
import { CreatedAt } from "./helpers";

export const doctorSchedules = pgTable(
  "doctor_schedules",
  {
    scheduleId: serial("schedule_id").primaryKey(),
    hpName: varchar("hp_name", { length: 100 })
      .notNull()
      .references(() => healthcareProviders.hpName),
    doctorName: varchar("doctor_name", { length: 100 })
      .notNull()
      .references(() => doctors.doctorName),
    scheduleType: varchar("schedule_type", { length: 20 }).notNull(), // 'Daily','Weekly','Monthly'
    dayOfWeek: integer("day_of_week"), // 0=Sun...6=Sat
    dayOfMonth: integer("day_of_month"), // 1-31
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    maxBookings: integer("max_bookings").notNull().default(1),
    isActive: boolean("is_active").default(true),
    createdAt: CreatedAt,
  },
  (table) => ({
    scheduleTypeCheck: check(
      "chk_schedule_type",
      sql`${table.scheduleType} IN ('Daily', 'Weekly', 'Monthly')`
    ),
    dayOfWeekCheck: check(
      "chk_day_of_week",
      sql`${table.dayOfWeek} BETWEEN 0 AND 6`
    ),
    dayOfMonthCheck: check(
      "chk_day_of_month",
      sql`${table.dayOfMonth} BETWEEN 1 AND 31`
    ),
  })
);

export const doctorSchedulesRelations = relations(
  doctorSchedules,
  ({ one }) => ({
    healthcareProvider: one(healthcareProviders, {
      fields: [doctorSchedules.hpName],
      references: [healthcareProviders.hpName],
    }),
    doctor: one(doctors, {
      fields: [doctorSchedules.doctorName],
      references: [doctors.doctorName],
    }),
  })
);
