import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { adminSupabase } from "@/lib/supabase";

type Bucket = { count: number; resetAt: number };

const globalStore = globalThis as typeof globalThis & { __cantoaRateLimits?: Map<string, Bucket> };
const buckets = globalStore.__cantoaRateLimits || new Map<string, Bucket>();
globalStore.__cantoaRateLimits = buckets;

export function requestFingerprint(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const ua = request.headers.get("user-agent") || "unknown";
  return `${ip}:${ua.slice(0, 120)}`;
}

export function requestFingerprintHash(request: NextRequest, scope = "") {
  return createHash("sha256").update(`${requestFingerprint(request)}|${scope}|cantoa-public-v2`).digest("hex");
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: Math.max(0, limit - 1), retryAfterSeconds: Math.ceil(windowMs / 1000), distributed: false };
  }
  if (current.count >= limit) {
    return { ok: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)), distributed: false };
  }
  current.count += 1;
  return { ok: true, remaining: Math.max(0, limit - current.count), retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)), distributed: false };
}

/**
 * Public/unlisted routes cannot use the authenticated-user limiter. Prefer the
 * Supabase-backed limiter added in v18.8.49 so limits survive serverless instance
 * changes. If the migration has not been run yet, fall back to the in-memory guard
 * rather than making gift/contribution links unusable.
 */
export async function checkPublicRateLimit(request: NextRequest, action: string, limit: number, windowSeconds: number) {
  const actionKey = createHash("sha256").update(`${action}|cantoa-action-v1`).digest("hex").slice(0, 40);
  const fingerprint = requestFingerprintHash(request, actionKey);
  const admin = adminSupabase();
  if (admin) {
    const { data, error } = await admin.rpc("check_cantoa_public_rate_limit", {
      p_fingerprint: fingerprint,
      p_action: actionKey,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (!error) {
      return {
        ok: Boolean(data),
        remaining: null as number | null,
        retryAfterSeconds: Math.max(1, windowSeconds),
        distributed: true,
      };
    }
  }
  return checkRateLimit(`${actionKey}:${fingerprint}`, limit, windowSeconds * 1000);
}
