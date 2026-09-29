import { Hono } from "hono";
import { sqlite } from "../db/index.js";
import { randomUUID } from "node:crypto";

export const stampRoutes = new Hono();

function toStampJson(row: any) {
  return { id: row.id, userId: row.user_id, checkpointId: row.checkpoint_id, acquiredAt: row.acquired_at };
}
function toCheckpointJson(row: any) {
  return { id: row.id, name: row.name, description: row.description, order: row.order, qrCodeValue: row.qr_code_value, lat: row.lat, lng: row.lng, imageUrl: row.image_url, createdAt: row.created_at, updatedAt: row.updated_at };
}

stampRoutes.post("/acquire", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "Invalid body" }, 400);
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const qrCodeValue = typeof body.qrCodeValue === "string" ? body.qrCodeValue.trim() : "";
  if (!userId || !qrCodeValue) return c.json({ error: "userId and qrCodeValue required" }, 400);
  if (userId.length > 128) return c.json({ error: "userId must be at most 128 characters" }, 400);
  if (qrCodeValue.length > 256) return c.json({ error: "qrCodeValue must be at most 256 characters" }, 400);

  const existingUser = sqlite.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as any;
  if (!existingUser) {
    sqlite.prepare(`INSERT INTO users (id, created_at) VALUES (?, ?)`).run(userId, new Date().toISOString());
  }

  const cp = sqlite.prepare(`SELECT * FROM checkpoints WHERE qr_code_value = ?`).get(qrCodeValue) as any;
  if (!cp) return c.json({ error: "Invalid QR code" }, 404);

  const dup = sqlite.prepare(`SELECT * FROM stamp_records WHERE user_id = ? AND checkpoint_id = ?`).get(userId, cp.id) as any;
  if (dup) return c.json({ error: "Already acquired", stamp: toStampJson(dup) }, 409);

  const now = new Date().toISOString();
  const id = randomUUID();
  sqlite.prepare(`INSERT INTO stamp_records (id, user_id, checkpoint_id, acquired_at) VALUES (?, ?, ?, ?)`).run(id, userId, cp.id, now);
  const stamp = sqlite.prepare(`SELECT * FROM stamp_records WHERE id = ?`).get(id) as any;
  return c.json({ stamp: toStampJson(stamp), checkpoint: toCheckpointJson(cp) }, 201);
});

stampRoutes.get("/:userId", async (c) => {
  const userId = c.req.param("userId");
  const rows = sqlite.prepare(`SELECT * FROM stamp_records WHERE user_id = ? ORDER BY acquired_at ASC`).all(userId) as any[];
  return c.json(rows.map(toStampJson));
});
