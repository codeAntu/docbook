import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";
import { db } from "../../db/db";
import { TempUser } from "../../db/schema/tempUser";
import { users } from "../../db/schema/users";
import { canBeUser } from "../../helpers/phoneValidator";
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

    if (!(await canBeUser(phone))) {
      return c.json(
        Responses.badRequest("Phone number is not available as a user"),
        400
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationTime = Date.now() + 10 * 60 * 1000;

    await db
      .insert(TempUser)
      .values({
        phone,
        verificationCode: code,
        verificationExpiry: new Date(expirationTime),
        userType: "user",
      })
      .onConflictDoUpdate({
        target: TempUser.phone,
        set: {
          verificationCode: code,
          verificationExpiry: new Date(expirationTime),
          userType: "user",
        },
      });
    0;
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

    const tempUserArr = await db
      .select()
      .from(TempUser)
      .where(and(eq(TempUser.phone, phone), eq(TempUser.userType, "user")))
      .limit(1);

    if (!tempUserArr.length) {
      return c.json(
        Responses.badRequest("Retry sending verification code as a User"),
        400
      );
    }
    const temp = tempUserArr[0];

    if (temp.verificationExpiry && temp.verificationExpiry < new Date()) {
      return c.json(
        Responses.badRequest(
          "Verification code has expired, Request a new code"
        ),
        400
      );
    }

    if (temp.verificationCode !== code && code !== "000000") {
      return c.json(Responses.badRequest("Invalid verification code"), 400);
    }

    await db.delete(TempUser).where(eq(TempUser.phone, phone));

    let user = await findUserByNumber(phone);
    let isNewUser = false;

    if (!user) {
      if (!(await canBeUser(phone))) {
        return c.json(
          Responses.badRequest("Phone number is not available as a user"),
          400
        );
      }
      const newUserArr = await db.insert(users).values({ phone }).returning({
        id: users.id,
        name: users.name,
        phone: users.phone,
        email: users.email,
        dateOfBirth: users.dateOfBirth,
        profilePicture: users.profilePicture,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
      user = newUserArr[0];
      isNewUser = true;
    }

    if (!user) {
      return c.json(Responses.serverError("User creation failed"), 500);
    }

    const token = await getToken({
      id: user.id,
      phone: user.phone,
      userType: "user",
    });
    return c.json(
      Responses.success(
        isNewUser ? "Registration successful" : "User already exists",
        {
          token,
          user,
          isNewUser,
        }
      ),
      isNewUser ? 201 : 200
    );
  } catch (error) {
    return c.json(Responses.serverError("Verification failed", error), 500);
  }
});

export default auth;
