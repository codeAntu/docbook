import { relations } from "drizzle-orm";
import {
  date,
  integer,
  pgTable,
  serial,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { doctorSchedules } from "./doctorSchedule";
import { CreatedAt } from "./helpers";
import { users } from "./users";

export const bookings = pgTable("bookings", {
  bookingId: serial("booking_id").primaryKey(),
  scheduleId: integer("schedule_id")
    .notNull()
    .references(() => doctorSchedules.scheduleId),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  bookingForDate: date("booking_for_date").notNull(),
  bookingStatus: varchar("booking_status", { length: 20 }).default("Booked"),
  createdAt: CreatedAt,
});

export const bookingsRelations = relations(bookings, ({ one }) => ({
  schedule: one(doctorSchedules, {
    fields: [bookings.scheduleId],
    references: [doctorSchedules.scheduleId],
  }),
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
}));
