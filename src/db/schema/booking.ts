import { relations } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";
import { doctorSchedules } from "./doctorSchedule";
import {
  BookingForDate,
  BookingStatus,
  CreatedAt,
  ID,
  uuidRef,
} from "./helpers";
import { users } from "./users";

export const bookings = pgTable("bookings", {
  id: ID,
  scheduleId: uuidRef("schedule_id")
    .references(() => doctorSchedules.id)
    .notNull(),
  userId: uuidRef("user_id")
    .references(() => users.id)
    .notNull(),
  bookingForDate: BookingForDate,
  bookingStatus: BookingStatus,
  createdAt: CreatedAt,
});

export const bookingsRelations = relations(bookings, ({ one }) => ({
  schedule: one(doctorSchedules, {
    fields: [bookings.scheduleId],
    references: [doctorSchedules.id],
  }),
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
}));
