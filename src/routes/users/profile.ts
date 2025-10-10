import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";
import { db } from "../../db/db";
import { users } from "../../db/schema/users";
import { authMiddleware, requireUserType } from "../../utils/authMiddleware";
import { Responses } from "../../utils/responses";
import { UserAuthToken } from "../../utils/token";

type Variables = {
  user: UserAuthToken;
};

const profile = new Hono<{ Variables: Variables }>();

profile.use("/*", authMiddleware, requireUserType("user"));

const zUpdateProfile = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  dateOfBirth: z.string().optional(),
  profilePicture: z.string().url().optional(),
});

profile.get("/", async (c) => {
  try {
    const userData = c.get("user");

    const user = await db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phone,
        email: users.email,
        dateOfBirth: users.dateOfBirth,
        profilePicture: users.profilePicture,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userData.id))
      .limit(1);

    if (!user.length) {
      return c.json(Responses.badRequest("User not found"), 404);
    }

    return c.json(
      Responses.success("Profile retrieved", { user: user[0] }),
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
      .update(users)
      .set(updateData)
      .where(eq(users.id, userData.id))
      .returning({
        id: users.id,
        name: users.name,
        phone: users.phone,
        email: users.email,
        dateOfBirth: users.dateOfBirth,
        profilePicture: users.profilePicture,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    if (!updated.length) {
      return c.json(Responses.badRequest("User not found"), 404);
    }

    return c.json(
      Responses.success("Profile updated", { user: updated[0] }),
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
