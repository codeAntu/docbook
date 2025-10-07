import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import { sendVerificationCode } from "../../sms/sms";
import { findUserByNumber } from "../../helpers/users/users";

const auth = new Hono();

const zSendCode = z.object({
  number: z.string().min(7).max(15),
});

const zLogin = z.object({
  number: z.string().min(7).max(15),
  code: z.string().length(6),
});

const zRegister = z.object({
  name: z.string().min(3).max(256),
  number: z.string().min(7).max(15),
  email: z.string().email().optional(),
});

auth.post("/send-code", zValidator("json", zSendCode), async (c) => {
  const { number } = c.req.valid("json");

  const user = await findUserByNumber(number);
  if (user) {
    return c.json(
      {
        message: `User with number ${number} already exists and is verified`,
        status: "error",
      },
      400
    );
  }

  return c.json({
    message: `Verification code sent to ${number}`,
    status: "success",
  });
});

auth.post("/login", zValidator("json", zLogin), async (c) => {
  const { number, code } = c.req.valid("json");

  return c.json({
    message: "Login successful",
    status: "success",
    token: "your_jwt_token_here",
  });
});

auth.post("/register", zValidator("json", zRegister), async (c) => {});

export default auth;
