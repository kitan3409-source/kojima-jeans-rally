import { Hono } from "hono";
import { sqlite } from "../db/index.js";
import { requireAdmin } from "./checkpoints.js";

export const statsRoutes = new Hono();

statsRoutes.get("/", async (c) => {
  const err = requireAdmin(c);
  if (err) return err;
  const totalUsers = (sqlite.prepare(`SELECT COUNT(*) AS n FROM users`).get() as any).n;
  const totalStamps = (sqlite.prepare(`SELECT COUNT(*) AS n FROM stamp_records`).get() as any).n;
  const totalCheckpoints = (sqlite.prepare(`SELECT COUNT(*) AS n FROM checkpoints`).get() as any).n;

  let completions = 0;
  if (totalCheckpoints > 0) {
    completions = (sqlite.prepare(`
      SELECT COUNT(*) AS n FROM (
        SELECT user_id FROM stamp_records GROUP BY user_id HAVING COUNT(*) = ?
      )
    `).get(totalCheckpoints) as any).n;
  }
  const completionRate = totalUsers > 0 ? completions / totalUsers : 0;

  const perCheckpoint = (sqlite.prepare(`
    SELECT c.id AS checkpointId, c.name AS name, c."order" AS "order", COUNT(s.id) AS count
    FROM checkpoints c
    LEFT JOIN stamp_records s ON s.checkpoint_id = c.id
    GROUP BY c.id
    ORDER BY c."order" ASC
  `).all() as any[]).map((row) => ({
    checkpointId: row.checkpointId,
    name: row.name,
    order: row.order,
    count: row.count,
  }));

  const recent = (sqlite.prepare(`
    SELECT user_id AS userId, checkpoint_id AS checkpointId, acquired_at AS acquiredAt
    FROM stamp_records
    ORDER BY acquired_at DESC
    LIMIT 10
  `).all() as any[]).map((row) => ({
    userId: row.userId,
    checkpointId: row.checkpointId,
    acquiredAt: row.acquiredAt,
  }));

  return c.json({ totalUsers, totalStamps, totalCheckpoints, completions, completionRate, perCheckpoint, recent });
});

statsRoutes.get("/leaderboard", async (c) => {
  const err = requireAdmin(c);
  if (err) return err;
  const limitParam = Number(c.req.query("limit") ?? 20);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), 100) : 20;

  const totalCheckpoints = (sqlite.prepare(`SELECT COUNT(*) AS n FROM checkpoints`).get() as any).n;

  const rows = sqlite.prepare(`
    SELECT s.user_id AS userId, COUNT(*) AS stamps, MIN(s.acquired_at) AS firstAt, MAX(s.acquired_at) AS lastAt, p.nickname AS nickname
    FROM stamp_records s
    LEFT JOIN profiles p ON p.user_id = s.user_id
    GROUP BY s.user_id
  `).all() as any[];

  const entries = rows.map((row) => {
    const stamps = row.stamps as number;
    const firstAt = row.firstAt as string;
    const lastAt = row.lastAt as string;
    const durationMs = stamps > 1 ? new Date(lastAt).getTime() - new Date(firstAt).getTime() : 0;
    return {
      userId: row.userId as string,
      nickname: (row.nickname ?? null) as string | null,
      stamps,
      completed: totalCheckpoints > 0 && stamps >= totalCheckpoints,
      durationMs,
      lastAcquiredAt: lastAt,
    };
  });

  entries.sort((a, b) => {
    if (b.stamps !== a.stamps) return b.stamps - a.stamps;
    if (a.completed !== b.completed) return a.completed ? -1 : 1;
    if (a.durationMs !== b.durationMs) return a.durationMs - b.durationMs;
    if (a.userId < b.userId) return -1;
    if (a.userId > b.userId) return 1;
    return 0;
  });

  const leaderboard = entries.slice(0, limit).map((entry, i) => ({ rank: i + 1, ...entry }));
  return c.json(leaderboard);
});
