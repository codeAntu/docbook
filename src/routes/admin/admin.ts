import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import { db } from "../../db/db";
import { doctors } from "../../db/schema";
import { Responses } from "../../utils/responses";

const adminRoute = new Hono();

const zDoctor = z.object({
  name: z.string().min(3).max(256),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(15),
  about: z.string().optional(),
  specialization: z.string().min(2).max(100).optional(),
});

adminRoute.get("/doctors", async (c) => {
  try {
    const allDoctors = await db.select().from(doctors);

    return c.json(
      Responses.success("List of all doctors", { doctors: allDoctors }),
      200
    );
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return c.json(Responses.serverError("Error fetching doctors", error), 500);
  }
});

adminRoute.post("/doctors", zValidator("json", zDoctor), async (c) => {
  try {
    const doctorData = c.req.valid("json");
    const newDoctor = await db.insert(doctors).values(doctorData).returning();
    return c.json(
      Responses.created("Doctor created successfully", {
        doctor: newDoctor[0],
      }),
      201
    );
  } catch (error) {
    console.error("Error creating doctor:", error);
    return c.json(Responses.serverError("Error creating doctor", error), 500);
  }
});

export default adminRoute;
