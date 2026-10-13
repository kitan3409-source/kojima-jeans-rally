import { timingSafeEqual } from "node:crypto";
import type { Context } from "hono";
import { getConnInfo } from "@hono/node-server/conninfo";
import { ADMIN_TOKEN, trustedClientIpHeader } from "./config.js";

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export function clientIp(c: Context): string {
  if (trustedClientIpHeader) {
    const forwarded = c.req.header(trustedClientIpHeader)?.split(",").at(-1)?.trim();
    if (forwarded) return forwarded;
  }
  try {
    return getConnInfo(c).remote.address ?? "unknown";
  } catch {
    return "unknown";
  }
}

type Bucket = { count: number; resetAt: number };

export interface RateLimiter {
  hit(key: string): { allowed: boolean; retryAfterSec: number };
  reset(key: string): void;
}

export function createRateLimiter(limit: number, windowMs: number): RateLimiter {
  const buckets = new Map<string, Bucket>();

  function sweep(now: number) {
    if (buckets.size < 1000) return;
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }

  return {
    hit(key) {
      const now = Date.now();
      sweep(now);
      const bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfterSec: 0 };
      }
      bucket.count += 1;
      if (bucket.count > limit) {
        return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
      }
      return { allowed: true, retryAfterSec: 0 };
    },
    reset(key) {
      buckets.delete(key);
    },
  };
}

const adminAttempts = createRateLimiter(10, 5 * 60 * 1000);

export function isAdmin(c: Context): boolean {
  const token = c.req.header("X-Admin-Token");
  return typeof token === "string" && safeEqual(token, ADMIN_TOKEN);
}

/** Returns a response when the request must be rejected, otherwise null. */
export function requireAdmin(c: Context) {
  const ip = clientIp(c);
  if (isAdmin(c)) {
    adminAttempts.reset(ip);
    return null;
  }
  const { allowed, retryAfterSec } = adminAttempts.hit(ip);
  if (!allowed) {
    return c.json({ error: "Too many attempts" }, 429, { "Retry-After": String(retryAfterSec) });
  }
  return c.json({ error: "Unauthorized" }, 401);
}

export function rateLimit(c: Context, limiter: RateLimiter, scope: string) {
  const { allowed, retryAfterSec } = limiter.hit(`${scope}:${clientIp(c)}`);
  if (allowed) return null;
  return c.json({ error: "Too many requests" }, 429, { "Retry-After": String(retryAfterSec) });
}
