import { Hono } from "hono";
import { sqlite } from "../db/index.js";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { createRateLimiter, rateLimit } from "../security.js";

export const authRoutes = new Hono();

const USER_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;
const LOGIN_ID_PATTERN = /^[a-z0-9_-]{3,24}$/;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 72;
const DUMMY_SALT = "0".repeat(32);

const registerLimiter = createRateLimiter(10, 60 * 1000);
const loginLimiter = createRateLimiter(10, 60 * 1000);
// consecutive failures per account are throttled harder than the per-IP limit
const loginAttempts = createRateLimiter(8, 5 * 60 * 1000);

function hashPassword(password: string, salt: string): Buffer {
  return scryptSync(password, salt, 32);
}

authRoutes.get("/status/:userId", (c) => {
  const userId = c.req.param("userId");
  if (!USER_ID_PATTERN.test(userId)) return c.json({ error: "userId format is invalid" }, 400);
  const row = sqlite.prepare(`SELECT login_id FROM accounts WHERE user_id = ?`).get(userId) as any;
  return c.json({ userId, registered: Boolean(row), loginId: row?.login_id ?? null });
});

authRoutes.post("/register", async (c) => {
  const limited = rateLimit(c, registerLimiter, "register");
  if (limited) return limited;
  const body = await c.req.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
  const loginId = typeof body?.loginId === "string" ? body.loginId.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!USER_ID_PATTERN.test(userId)) return c.json({ error: "userId format is invalid" }, 400);
  if (!LOGIN_ID_PATTERN.test(loginId)) {
    return c.json({ error: "loginId must be 3-24 characters of a-z, 0-9, _ or -" }, 400);
  }
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return c.json({ error: "password must be 6-72 characters" }, 400);
  }

  const now = new Date().toISOString();
  if (!sqlite.prepare(`SELECT id FROM users WHERE id = ?`).get(userId)) {
    sqlite.prepare(`INSERT INTO users (id, created_at) VALUES (?, ?)`).run(userId, now);
  }
  if (sqlite.prepare(`SELECT user_id FROM accounts WHERE user_id = ?`).get(userId)) {
    return c.json({ error: "An account is already registered for this device" }, 409);
  }
  if (sqlite.prepare(`SELECT user_id FROM accounts WHERE login_id = ?`).get(loginId)) {
    return c.json({ error: "This login ID is already in use" }, 409);
  }
  const salt = randomBytes(16).toString("hex");
  sqlite
    .prepare(
      `INSERT INTO accounts (login_id, user_id, password_hash, salt, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(loginId, userId, hashPassword(password, salt).toString("hex"), salt, now, now);
  return c.json({ userId, loginId }, 201);
});

authRoutes.post("/login", async (c) => {
  const limited = rateLimit(c, loginLimiter, "login");
  if (limited) return limited;
  const body = await c.req.json().catch(() => null);
  const loginId = typeof body?.loginId === "string" ? body.loginId.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const invalid = () => c.json({ error: "loginId or password is incorrect" }, 401);
  if (!LOGIN_ID_PATTERN.test(loginId) || !password || password.length > PASSWORD_MAX) {
    return invalid();
  }

  const attemptKey = `login:${loginId}`;
  const check = loginAttempts.hit(attemptKey);
  if (!check.allowed) {
    return c.json({ error: "Too many attempts" }, 429, { "Retry-After": String(check.retryAfterSec) });
  }

  const row = sqlite
    .prepare(`SELECT user_id, password_hash, salt FROM accounts WHERE login_id = ?`)
    .get(loginId) as any;
  const candidate = hashPassword(password, row?.salt ?? DUMMY_SALT);
  const stored = row ? Buffer.from(row.password_hash, "hex") : candidate;
  const ok = Boolean(row) && candidate.length === stored.length && timingSafeEqual(candidate, stored);
  if (!ok) return invalid();
  loginAttempts.reset(attemptKey);
  return c.json({ userId: row.user_id, loginId });
});
