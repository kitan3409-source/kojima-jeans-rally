import { Hono } from "hono";
import { sqlite } from "../db/index.js";
import { randomUUID } from "node:crypto";
import { createRateLimiter, rateLimit } from "../security.js";

export const stampRoutes = new Hono();

const acquireLimiter = createRateLimiter(30, 60 * 1000);
const USER_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

// How close the device must report being to the checkpoint, in meters.
const GEO_RADIUS_M = Number(process.env.GEO_RADIUS_M) > 0 ? Number(process.env.GEO_RADIUS_M) : 500;
// GPS accuracy is credited toward the radius, capped so huge indoor fixes
// don't make the check meaningless.
const GEO_ACCURACY_CAP_M = Number(process.env.GEO_ACCURACY_CAP_M) > 0 ? Number(process.env.GEO_ACCURACY_CAP_M) : 500;

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

function finiteNumber(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function toStampJson(row: any) {
  return { id: row.id, userId: row.user_id, checkpointId: row.checkpoint_id, acquiredAt: row.acquired_at };
}
function toCheckpointJson(row: any) {
  return { id: row.id, name: row.name, description: row.description, order: row.order, lat: row.lat, lng: row.lng, imageUrl: row.image_url, createdAt: row.created_at, updatedAt: row.updated_at };
}

stampRoutes.post("/acquire", async (c) => {
  const limited = rateLimit(c, acquireLimiter, "acquire");
  if (limited) return limited;
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "Invalid body" }, 400);
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const qrCodeValue = typeof body.qrCodeValue === "string" ? body.qrCodeValue.trim() : "";
  if (!userId || !qrCodeValue) return c.json({ error: "userId and qrCodeValue required" }, 400);
  if (!USER_ID_PATTERN.test(userId)) return c.json({ error: "userId format is invalid" }, 400);
  if (qrCodeValue.length > 256) return c.json({ error: "qrCodeValue must be at most 256 characters" }, 400);

  const existingUser = sqlite.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as any;
  if (!existingUser) {
    sqlite.prepare(`INSERT INTO users (id, created_at) VALUES (?, ?)`).run(userId, new Date().toISOString());
  }

  const cp = sqlite.prepare(`SELECT * FROM checkpoints WHERE qr_code_value = ?`).get(qrCodeValue) as any;
  if (!cp) return c.json({ error: "Invalid QR code" }, 404);

  const dup = sqlite.prepare(`SELECT * FROM stamp_records WHERE user_id = ? AND checkpoint_id = ?`).get(userId, cp.id) as any;
  if (dup) return c.json({ error: "Already acquired", stamp: toStampJson(dup) }, 409);

  // Anti-forgery: the device must report a location near the checkpoint.
  const lat = finiteNumber(body.lat);
  const lng = finiteNumber(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return c.json({ error: "location_required" }, 400);
  }
  const accuracy = Math.min(Math.max(finiteNumber(body.accuracy) || 0, 0), GEO_ACCURACY_CAP_M);
  const cpLat = finiteNumber(cp.lat);
  const cpLng = finiteNumber(cp.lng);
  if (Number.isFinite(cpLat) && Number.isFinite(cpLng)) {
    const distance = haversineMeters(lat, lng, cpLat, cpLng);
    if (distance > GEO_RADIUS_M + accuracy) {
      return c.json({ error: "too_far", distance: Math.round(distance), allowed: GEO_RADIUS_M }, 403);
    }
  } else {
    console.warn(`checkpoint ${cp.id} has no coordinates; skipping location check`);
  }

  const now = new Date().toISOString();
  const id = randomUUID();
  sqlite.prepare(`INSERT INTO stamp_records (id, user_id, checkpoint_id, acquired_at) VALUES (?, ?, ?, ?)`).run(id, userId, cp.id, now);
  const stamp = sqlite.prepare(`SELECT * FROM stamp_records WHERE id = ?`).get(id) as any;
  return c.json({ stamp: toStampJson(stamp), checkpoint: toCheckpointJson(cp) }, 201);
});

stampRoutes.get("/:userId", async (c) => {
  const userId = c.req.param("userId");
  if (!USER_ID_PATTERN.test(userId)) return c.json({ error: "userId format is invalid" }, 400);
  const rows = sqlite.prepare(`SELECT * FROM stamp_records WHERE user_id = ? ORDER BY acquired_at ASC`).all(userId) as any[];
  return c.json(rows.map(toStampJson));
});
