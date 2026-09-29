import { Hono } from "hono";
import { sqlite } from "../db/index.js";
import { createRateLimiter, rateLimit } from "../security.js";

export const profileRoutes = new Hono();

const profileLimiter = createRateLimiter(20, 60 * 1000);
const USER_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

function toProfileJson(row: any) {
  return {
    userId: row.user_id,
    nickname: row.nickname,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

profileRoutes.get("/:userId", async (c) => {
  const userId = c.req.param("userId");
  if (!USER_ID_PATTERN.test(userId)) return c.json({ error: "userId format is invalid" }, 400);
  const row = sqlite.prepare(`SELECT * FROM profiles WHERE user_id = ?`).get(userId) as any;
  if (!row) return c.json({ userId, nickname: null });
  return c.json(toProfileJson(row));
});

profileRoutes.put("/:userId", async (c) => {
  const limited = rateLimit(c, profileLimiter, "profile");
  if (limited) return limited;
  const userId = c.req.param("userId");
  if (!USER_ID_PATTERN.test(userId)) return c.json({ error: "userId format is invalid" }, 400);
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body.nickname !== "string") {
    return c.json({ error: "nickname is required" }, 400);
  }
  const nickname = body.nickname.replace(/[\p{Cc}\p{Cf}]/gu, "").trim();
  if (nickname.length < 1 || nickname.length > 24) {
    return c.json({ error: "nickname must be 1-24 characters" }, 400);
  }
  const existingUser = sqlite.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as any;
  if (!existingUser) {
    sqlite.prepare(`INSERT INTO users (id, created_at) VALUES (?, ?)`).run(userId, new Date().toISOString());
  }
  const now = new Date().toISOString();
  sqlite.prepare(`
    INSERT INTO profiles (user_id, nickname, created_at, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET nickname = excluded.nickname, updated_at = excluded.updated_at
  `).run(userId, nickname, now, now);
  const row = sqlite.prepare(`SELECT * FROM profiles WHERE user_id = ?`).get(userId) as any;
  return c.json(toProfileJson(row));
});
