import { pgTable } from "drizzle-orm/pg-core";
import {
  CreatedAt,
  DateOfBirth,
  Email,
  ID,
  Name,
  Phone,
  ProfilePicture,
  UpdatedAt
} from "./helpers";

export const users = pgTable("users", {
  id: ID,
  name: Name,
  phone: Phone.unique(),
  email: Email.unique(),
  dateOfBirth: DateOfBirth,
  profilePicture: ProfilePicture,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
});
