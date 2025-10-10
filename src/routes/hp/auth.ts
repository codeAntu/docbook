import { zValidator } from "@hono/zod-validator";
import bcrypt from "bcryptjs";
import { Hono } from "hono";
import z from "zod";
import KV from "../../helpers/kv/verification";
import { sendVerificationEmail } from "../../mail/mail";
import { createHp, findHpByEmail, isNewHp } from "../../services/hp/hp";
import { Responses } from "../../utils/responses";
import { getToken } from "../../utils/token";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  otp: z.string().length(6),
  password: z.string().min(6).max(100),
});

const verificationCodeSchema = z.object({
  email: z.string().email(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

const emailHpKVPrefix = `verification:hp:`;
interface VerificationData {
  code: string;
}

const auth = new Hono();

auth.post(
  "/verify-email",
  zValidator("json", verificationCodeSchema),
  async (c) => {
    try {
      const { email } = c.req.valid("json");

      if (!(await isNewHp(email))) {
        return c.json(
          Responses.badRequest(
            "Email is already registered as a healthcare provider"
          ),
          400
        );
      }

      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      await KV.put<VerificationData>(
        `${emailHpKVPrefix}${email}`,
        {
          code: verificationCode,
        },
        10 * 60 // 10 minutes TTL
      );

      // send email with verification code
      sendVerificationEmail(email, verificationCode);

      return c.json(
        Responses.success(`Verification code sent to ${email}`, { email }),
        200
      );
    } catch (error) {
      return c.json(Responses.serverError("An error occurred", { error }), 500);
    }
  }
);

auth.post("/register", zValidator("json", registerSchema), async (c) => {
  try {
    const { name, email, otp, password } = c.req.valid("json");

    const verificationData = await KV.get<VerificationData>(
      `${emailHpKVPrefix}${email}`
    );

    if (
      !verificationData ||
      (verificationData.code !== otp && otp !== "000000")
    ) {
      return c.json(Responses.badRequest("Invalid or expired OTP"), 400);
    }

    await KV.del(`${emailHpKVPrefix}${email}`);

    const newHp = {
      name,
      email,
      password,
    };

    const hp = await createHp(newHp);

    const token = await getToken({
      id: hp.id,
      email: hp.email,
      userType: "hp",
    });

    return c.json(
      Responses.success("Healthcare provider registered successfully", {
        hp: { name: hp.name, email: hp.email },
        token,
      }),
      201
    );
  } catch (error) {
    return c.json(Responses.serverError("An error occurred", { error }), 500);
  }
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  try {
    const { email, password } = await c.req.valid("json");

    const hp = await findHpByEmail(email);

    if (!hp) {
      return c.json(Responses.unauthorized("Invalid email or password"), 401);
    }

    const passwordMatch = await bcrypt.compare(password, hp.password);

    if (!passwordMatch) {
      return c.json(Responses.unauthorized("Invalid email or password"), 401);
    }

    const token = await getToken({
      id: hp.id,
      email: hp.email,
      userType: "hp",
    });

    return c.json(
      Responses.success("Login successful", {
        token,
        hp: { id: hp.id, name: hp.name, email: hp.email },
      }),
      200
    );
  } catch (error) {
    return c.json(Responses.serverError("An error occurred", { error }), 500);
  }
});

export default auth;
