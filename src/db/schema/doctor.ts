import { relations } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";
import { departments } from "./department";
import {
  About,
  CreatedAt,
  DateOfBirth,
  Department,
  DepartmentId,
  Email,
  Gender,
  ID,
  Name,
  Phone,
  ProfilePicture,
  Qualifications,
  Specialty,
  UpdatedAt,
} from "./helpers";

export const doctors = pgTable("doctors", {
  id: ID,
  name: Name,
  email: Email,
  phone: Phone,
  about: About,
  gender: Gender,
  dateOfBirth: DateOfBirth,
  profilePicture: ProfilePicture,
  qualifications: Qualifications,
  specialty: Specialty,
  department: Department,
  departmentId: DepartmentId.references(() => departments.id),
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
});

export const doctorsRelations = relations(doctors, ({ one }) => ({
  department: one(departments, {
    fields: [doctors.departmentId],
    references: [departments.id],
  }),
}));
