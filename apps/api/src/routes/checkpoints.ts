import { Hono } from "hono";
import { sqlite } from "../db/index.js";
import { randomUUID } from "node:crypto";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "kojima2026";

export const checkpointRoutes = new Hono();

function requireAdmin(c: any) {
  const token = c.req.header("X-Admin-Token");
  if (token !== ADMIN_TOKEN) return c.json({ error: "Unauthorized" }, 401);
  return null;
}

function toJson(row: any) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    order: row.order,
    qrCodeValue: row.qr_code_value,
    lat: row.lat,
    lng: row.lng,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

checkpointRoutes.get("/", async (c) => {
  const rows = sqlite.prepare(`SELECT * FROM checkpoints ORDER BY "order" ASC`).all() as any[];
  return c.json(rows.map(toJson));
});

checkpointRoutes.post("/", async (c) => {
  const err = requireAdmin(c);
  if (err) return err;
  const body = await c.req.json();
  const { name, description, order, qrCodeValue, lat, lng, imageUrl } = body;
  if (!name || !description || order == null || !qrCodeValue) {
    return c.json({ error: "Missing required fields: name, description, order, qrCodeValue" }, 400);
  }
  const now = new Date().toISOString();
  const id = randomUUID();
  try {
    sqlite.prepare(`INSERT INTO checkpoints (id, name, description, "order", qr_code_value, lat, lng, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, name, description, order, qrCodeValue, lat ?? null, lng ?? null, imageUrl ?? null, now, now);
  } catch (e: any) {
    if (String(e.message).includes("UNIQUE")) return c.json({ error: "qrCodeValue already exists" }, 409);
    throw e;
  }
  const row = sqlite.prepare(`SELECT * FROM checkpoints WHERE id = ?`).get(id) as any;
  return c.json(toJson(row), 201);
});

checkpointRoutes.put("/:id", async (c) => {
  const err = requireAdmin(c);
  if (err) return err;
  const id = c.req.param("id");
  const body = await c.req.json();
  const now = new Date().toISOString();
  const map: Record<string, string> = { name: "name", description: "description", order: '"order"', qrCodeValue: "qr_code_value", lat: "lat", lng: "lng", imageUrl: "image_url" };
  const fields: string[] = [];
  const values: any[] = [];
  for (const [k, col] of Object.entries(map)) {
    if (body[k] !== undefined) { fields.push(`${col} = ?`); values.push(body[k]); }
  }
  if (!fields.length) return c.json({ error: "No fields to update" }, 400);
  fields.push("updated_at = ?");
  values.push(now);
  values.push(id);
  try {
    sqlite.prepare(`UPDATE checkpoints SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  } catch (e: any) {
    if (String(e.message).includes("UNIQUE")) return c.json({ error: "qrCodeValue already exists" }, 409);
    throw e;
  }
  const row = sqlite.prepare(`SELECT * FROM checkpoints WHERE id = ?`).get(id) as any;
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(toJson(row));
});

checkpointRoutes.delete("/:id", async (c) => {
  const err = requireAdmin(c);
  if (err) return err;
  const id = c.req.param("id");
  const result = sqlite.prepare(`DELETE FROM checkpoints WHERE id = ?`).run(id);
  if ((result as any).changes === 0) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});
