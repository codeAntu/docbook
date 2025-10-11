import {
  boolean,
  date,
  integer,
  pgEnum,
  text,
  time,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

export const scheduleTypeEnum = pgEnum("schedule_type", [
  "daily",
  "weekly",
  "monthly",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);

export const ScheduleStatus = pgEnum("schedule_status", [
  "active",
  "cancelled",
  "deleted",
]);

export const id = () => uuid("id").primaryKey().defaultRandom();

export const textField = (name: string, length = 256) =>
  varchar(name, { length });

export const longTextField = (name: string) => text(name);

export const uuidRef = (name: string) => uuid(name).notNull();

export const intField = (name: string) => integer(name);

export const boolField = (name: string, defaultValue = true) =>
  boolean(name).default(defaultValue);

export const dateField = (name: string) => date(name).notNull();

export const timeField = (name: string) => time(name).notNull();

export const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const deletedAt = () => timestamp("deleted_at", { withTimezone: true });

// Primary Key
export const ID = id();

// Common Fields
export const Name = textField("name");
export const Email = textField("email");
export const Phone = textField("phone", 15).notNull();
export const ContactNumber = textField("contact_number", 15);
export const Address = textField("address", 200);
export const Type = textField("type", 50);
export const Password = textField("password", 100).notNull();

// User Fields
export const ProfilePicture = textField("profile_picture", 512);
export const Gender = genderEnum("gender");
export const DateOfBirth = textField("date_of_birth", 10);

// Text Content
export const Description = longTextField("description");

// Schedule Fields
export const ScheduleType = scheduleTypeEnum("schedule_type").notNull();
export const DayOfWeek = intField("day_of_week");
export const DayOfMonth = intField("day_of_month");
export const StartTime = timeField("start_time");
export const EndTime = timeField("end_time");
export const MaxBookings = intField("max_bookings").notNull().default(1);
export const IsActive = boolField("is_active", true);

// Booking Fields
export const BookingForDate = dateField("booking_for_date");
export const BookingStatus =
  bookingStatusEnum("booking_status").default("pending");

// Timestamps
export const CreatedAt = createdAt();
export const UpdatedAt = updatedAt();
export const DeletedAt = deletedAt();

// Verification
export const VerificationCode = textField("verification_code", 6);
export const VerificationExpiry = timestamp("verification_expiry", {
  withTimezone: true,
});
