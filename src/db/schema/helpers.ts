import { pgEnum, text, uuid, varchar } from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

export const ID = uuid("id").primaryKey().defaultRandom();
export const Name = varchar("name", { length: 256 }).notNull();
export const Phone = varchar("phone", { length: 15 }).notNull().unique();
export const Email = varchar("email", { length: 256 }).unique();
export const CreatedAt = varchar("created_at", { length: 30 }).notNull();
export const UpdatedAt = varchar("updated_at", { length: 30 }).notNull();
export const Password = varchar("password", { length: 256 }).notNull();
export const ProfilePicture = varchar("profile_picture", {
  length: 512,
});
export const Gender = genderEnum("gender");
export const DateOfBirth = varchar("date_of_birth", { length: 10 });
export const About = text("about");
export const Qualifications = text("qualifications");
export const Specialty = varchar("specialty", { length: 256 });
export const Department = varchar("department", { length: 256 });
export const DepartmentId = uuid("department_id");
export const Description = text("description");
