import { sign, decode } from "hono/jwt";

const secretKey = process.env.JWT_SECRET || "default_secret";

export interface Token {
  id: string;
  phone: string;
}

export function getToken(user: Token) {
  return sign(
    {
      id: user.id,
      phone: user.phone,
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
