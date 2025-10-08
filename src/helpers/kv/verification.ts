import { env } from "cloudflare:workers";

export interface VerificationData {
  code: string;
  userType: "user" | "doctor";
}

/**
 * Store data in KV
 */
export async function put<T>(
  key: string,
  value: T,
  expirationTtl?: number
): Promise<void> {
  await env.KV.put(key, JSON.stringify(value), { expirationTtl });
}

/**
 * Get data from KV
 */
export async function get<T>(key: string): Promise<T | null> {
  const kvValue = await env.KV.get(key);

  if (!kvValue) {
    return null;
  }

  return JSON.parse(kvValue) as T;
}

/**
 * Delete data from KV
 */
export async function del(key: string): Promise<void> {
  await env.KV.delete(key);
}
