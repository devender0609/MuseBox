import type { NextRequest } from "next/server";

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

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: Math.max(0, limit - 1), retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }
  if (current.count >= limit) {
    return { ok: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  return { ok: true, remaining: Math.max(0, limit - current.count), retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
}
