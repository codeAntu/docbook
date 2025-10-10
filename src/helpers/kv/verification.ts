import { env } from "cloudflare:workers";

export interface VerificationData {
  code: string;
  userType: "user" | "doctor" | "hp";
}

export async function put<T>(
  key: string,
  value: T,
  expirationTtl?: number
): Promise<void> {
  await env.KV.put(key, JSON.stringify(value), { expirationTtl });
}

export async function get<T>(key: string): Promise<T | null> {
  const kvValue = await env.KV.get(key);
  if (!kvValue) {
    return null;
  }
  return JSON.parse(kvValue) as T;
}

export async function del(key: string): Promise<void> {
  await env.KV.delete(key);
}

const KV = {
  put,
  get,
  del,
};

export default KV;
