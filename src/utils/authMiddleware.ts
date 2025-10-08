import { Context, Next } from "hono";
import { Responses } from "./responses";
import { Token, verifyToken } from "./token";

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return c.json(Responses.badRequest("Missing authorization token"), 401);
  }

  const token = authHeader.replace("Bearer ", "");
  const userData = verifyToken(token);

  if (!userData) {
    return c.json(Responses.badRequest("Invalid or expired token"), 401);
  }

  c.set("user", userData);

  await next();
}

export function requireUserType(userType: "user" | "doctor") {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as Token;

    if (!user || user.userType !== userType) {
      return c.json(
        Responses.badRequest(`Access denied. ${userType} access required.`),
        403
      );
    }

    await next();
  };
}
