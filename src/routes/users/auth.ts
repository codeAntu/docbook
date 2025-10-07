import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";
import { db } from "../../db/db";
import { TempUser } from "../../db/schema/tempUser";
import { users } from "../../db/schema/users";
import { findUserByNumber } from "../../helpers/users/users";
import { sendVerificationCode } from "../../sms/sms";
import { Responses } from "../../utils/responses";
import { getToken } from "../../utils/token";

const auth = new Hono();

const zSendCode = z.object({
  phone: z.string().min(10).max(15),
});

const zVerifyCode = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(6),
});

auth.post("/send-code", zValidator("json", zSendCode), async (c) => {
  try {
    const { phone } = c.req.valid("json");

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationTime = Date.now() + 10 * 60 * 1000;

    // TODO: Use Redis here with TTL and Rate limiting
    await db
      .insert(TempUser)
      .values({
        phone,
        verificationCode: code,
        verificationExpiry: new Date(expirationTime),
      })
      .onConflictDoUpdate({
        target: TempUser.phone,
        set: {
          verificationCode: code,
          verificationExpiry: new Date(expirationTime),
        },
      });

    // Send SMS with verification code
    await sendVerificationCode(phone, code);

    return c.json(
      Responses.success(`Verification code sent to ${phone}`, {
        phone,
      }),
      200
    );
  } catch (error) {
    return c.json(
      Responses.serverError("Failed to send verification code", error),
      500
    );
  }
});

auth.post("/verify-code", zValidator("json", zVerifyCode), async (c) => {
  try {
    const { phone, code } = c.req.valid("json");

    const tempUser = await db
      .select()
      .from(TempUser)
      .where(eq(TempUser.phone, phone))
      .limit(1);

    if (!tempUser.length) {
      return c.json(
        Responses.badRequest("No verification code found for this number"),
        400
      );
    }

    const temp = tempUser[0];

    if (temp.verificationExpiry && temp.verificationExpiry < new Date()) {
      return c.json(
        Responses.badRequest(
          "Verification code has expired, Request a new code"
        ),
        400
      );
    }

    if (temp.verificationCode !== code) {
      return c.json(Responses.badRequest("Invalid verification code"), 400);
    }

    const existingUser = await findUserByNumber(phone);
    await db.delete(TempUser).where(eq(TempUser.phone, phone));

    if (existingUser) {
      const token = getToken({
        id: existingUser.id,
        phone: existingUser.phone,
      });
      return c.json(
        Responses.success("Login successful", {
          token,
          user: existingUser,
          isNewUser: false,
        }),
        200
      );
    }

    const newUser = await db.insert(users).values({ phone }).returning({
      id: users.id,
      phone: users.phone,
      email: users.email,
      dateOfBirth: users.dateOfBirth,
      profilePicture: users.profilePicture,
      
    });
    const token = getToken(newUser[0]);
    return c.json(
      Responses.success("Registration successful", {
        token,
        user: newUser[0],
        isNewUser: true,
      }),
      201
    );
  } catch (error) {
    return c.json(Responses.serverError("Verification failed", error), 500);
  }
});

export default auth;
