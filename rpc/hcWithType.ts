/**
 * Hono RPC Type Export
 *
 * This file exports the API types for use with Hono's RPC client.
 *
 * Build: bun run build:rpc
 * Output: dist/rpc/hcWithType.d.ts
 *
 * Frontend usage:
 * ```typescript
 * import { hc } from 'hono/client'
 * import type { AppType } from './hcWithType'
 *
 * const client = hc<AppType>('http://localhost:8787')
 *
 * // Example: Send verification code
 * const res = await client.api.users.auth['send-code'].$post({
 *   json: { phone: '1234567890' }
 * })
 * ```
 */

import type { appType } from "../src/index";

export type AppType = appType;
