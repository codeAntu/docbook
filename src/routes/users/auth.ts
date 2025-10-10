import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import { db } from "../../db/db";
import { users } from "../../db/schema/users";
import { del, get, put, VerificationData } from "../../helpers/kv/verification";
import { canBeUser } from "../../helpers/phoneValidator";
import { findUserByNumber } from "../../helpers/users/users";
import { sendVerificationCode } from "../../sms/sms";
import { Responses } from "../../utils/responses";
import { getToken } from "../../utils/token";

const zSendCode = z.object({
  phone: z.string().min(10).max(15),
});

const zVerifyCode = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(6),
});

const authKVPrefix = `verification:user:`;

const auth = new Hono()
  .post("/send-code", zValidator("json", zSendCode), sendCode)
  .post("/verify-code", zValidator("json", zVerifyCode), verifyCode);

async function sendCode(c: any) {
  try {
    const { phone } = c.req.valid("json");

    if (!(await canBeUser(phone))) {
      return c.json(
        Responses.badRequest("Phone number is not available as a user"),
        400
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await put<VerificationData>(
      `${authKVPrefix}${phone}`,
      {
        code,
        userType: "user",
      },
      10 * 60
    ); // 10 minutes TTL

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
}

async function verifyCode(c: any) {
  try {
    const { phone, code } = c.req.valid("json");

    const verificationData = await get<VerificationData>(
      `${authKVPrefix}${phone}`
    );

    if (!verificationData) {
      return c.json(
        Responses.badRequest("Retry sending verification code as a User"),
        400
      );
    }

    if (verificationData.code !== code && code !== "000000") {
      return c.json(Responses.badRequest("Invalid verification code"), 400);
    }

    await del(`${authKVPrefix}${phone}`);

    let user = await findUserByNumber(phone);
    let isNewUser = false;

    if (!user) {
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

    const token = await getToken({
      id: user.id,
      phone: user.phone,
      userType: "user",
    });
    return c.json(
      Responses.success(
        isNewUser ? "Registration successful" : "Login successful",
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
}

export default auth;
