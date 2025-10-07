import { relations } from "drizzle-orm";
import { pgTable, varchar } from "drizzle-orm/pg-core";
import { doctors } from "./doctor";
import { CreatedAt, Description, ID, UpdatedAt } from "./helpers";

export const departments = pgTable("departments", {
  id: ID,
  name: varchar("name", { length: 256 }).notNull().unique(),
  description: Description,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
});

export const departmentsRelations = relations(departments, ({ many }) => ({
  doctors: many(doctors),
}));
