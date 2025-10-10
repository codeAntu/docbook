import { decode, sign } from "hono/jwt";
import { ENV } from "../utils/env";

const secretKey = ENV.JWT_SECRET || "default_secret";

export interface UserAuthToken {
  id: string;
  userType: "user";
  phone?: string;
}

export interface HpAuthToken {
  id: string;
  userType: "hp";
  email?: string;
}

export type AuthToken = UserAuthToken | HpAuthToken;

export async function getToken(user: AuthToken) {
  return await sign(
    {
      id: user.id,
      userType: user.userType,
      phone: (user as UserAuthToken).phone,
      email: (user as HpAuthToken).email,
    },
    secretKey
  );
}

export function verifyToken(token: string): AuthToken | null {
  try {
    const { header, payload } = decode(token);
    return payload as unknown as AuthToken;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}
