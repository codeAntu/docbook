import { Context, Next } from "hono";
import { Responses } from "./responses";
import { HpAuthToken, verifyToken } from "./token";

export type UserType = "user" | "doctor" | "hp";

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return c.json(Responses.unauthorized("Missing authorization token"), 401);
  }

  if (!authHeader.startsWith("Bearer ")) {
    return c.json(Responses.unauthorized("Invalid authorization format"), 401);
  }

  const token = authHeader.substring(7); // More efficient than replace
  const userData = verifyToken(token);

  if (!userData) {
    return c.json(Responses.unauthorized("Invalid or expired token"), 401);
  }

  c.set("user", userData);

  await next();
}

export function requireUserType(...userTypes: UserType[]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as HpAuthToken;

    if (!user || !userTypes.includes(user.userType as UserType)) {
      return c.json(
        Responses.forbidden(
          `Access denied. Required user type: ${userTypes.join(" or ")}`
        ),
        403
      );
    }

    await next();
  };
}
