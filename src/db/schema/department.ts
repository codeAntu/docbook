import { relations } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";
import { doctors } from "./doctor";
import { CreatedAt, Description, ID, Name, UpdatedAt } from "./helpers";

export const departments = pgTable("departments", {
  id: ID,
  name: Name.unique(),
  description: Description,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
});

export const departmentsRelations = relations(departments, ({ many }) => ({
  doctors: many(doctors),
}));
