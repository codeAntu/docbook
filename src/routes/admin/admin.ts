import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import { db } from "../../db/db";
import { doctors } from "../../db/schema";

const admin = new Hono();

const zDoctor = z.object({
  name: z.string().min(3).max(256),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(15),
  about: z.string().optional(),
  specialization: z.string().min(2).max(100).optional(),
});

admin.get("/doctors", async (c) => {
  try {
    const allDoctors = await db.select().from(doctors);

    return c.json({
      message: "List of all doctors",
      status: "success",
      doctors: allDoctors,
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return c.json({
      message: "Error fetching doctors",
      status: "error",
    });
  }
});

admin.post("/doctors", zValidator("json", zDoctor), async (c) => {
  try {
    const doctorData = c.req.valid("json");
    const newDoctor = await db.insert(doctors).values(doctorData).returning();
    return c.json({
      message: "Doctor created successfully",
      status: "success",
      doctor: newDoctor,
    });
  } catch (error) {
    console.error("Error creating doctor:", error);
    return c.json({
      message: "Error creating doctor",
      status: "error",
    });
  }
});

export default admin;
