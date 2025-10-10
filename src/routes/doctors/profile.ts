import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";
import { db } from "../../db/db";
import { doctors } from "../../db/schema/doctor";
import { authMiddleware, requireUserType } from "../../utils/authMiddleware";
import { Responses } from "../../utils/responses";
import { Token } from "../../utils/token";

type Variables = {
  user: Token;
};

const profile = new Hono<{ Variables: Variables }>();

profile.use("/*", authMiddleware, requireUserType("doctor"));

const zUpdateProfile = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  about: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  profilePicture: z.string().url().optional(),
  qualifications: z.string().optional(),
  specialty: z.string().optional(),
});

profile.get("/", async (c) => {
  try {
    const userData = c.get("user");

    const doctor = await db
      .select({
        id: doctors.id,
        name: doctors.name,
        email: doctors.email,
      })
      .from(doctors)
      .where(eq(doctors.id, userData.id))
      .limit(1);

    if (!doctor.length) {
      return c.json(Responses.badRequest("Doctor not found"), 404);
    }

    return c.json(
      Responses.success("Profile retrieved", { doctor: doctor[0] }),
      200
    );
  } catch (error) {
    return c.json(
      Responses.serverError("Failed to retrieve profile", error),
      500
    );
  }
});

profile.put("/", zValidator("json", zUpdateProfile), async (c) => {
  try {
    const userData = c.get("user");
    const updateData = c.req.valid("json");

    if (Object.keys(updateData).length === 0) {
      return c.json(Responses.badRequest("No fields to update"), 400);
    }

    const updated = await db
      .update(doctors)
      .set(updateData)
      .where(eq(doctors.id, userData.id))
      .returning();

    if (!updated.length) {
      return c.json(Responses.badRequest("Doctor not found"), 404);
    }

    return c.json(
      Responses.success("Profile updated", { doctor: updated[0] }),
      200
    );
  } catch (error) {
    return c.json(
      Responses.serverError("Failed to update profile", error),
      500
    );
  }
});

export default profile;
