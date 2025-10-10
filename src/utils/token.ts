import { decode, sign } from "hono/jwt";
import { ENV } from "../utils/env";

const secretKey = ENV.JWT_SECRET || "default_secret";

export interface Token {
  id: string;
  phone: string;
  userType: "user" | "doctor";
}

export async function getToken(user: Token) {
  return await sign(
    {
      id: user.id,
      phone: user.phone,
      userType: user.userType,
    },
    secretKey
  );
}

export function verifyToken(token: string): Token | null {
  try {
    const { header, payload } = decode(token);
    return payload as unknown as Token;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}
