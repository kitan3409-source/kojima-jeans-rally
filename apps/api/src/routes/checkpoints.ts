import { Hono } from "hono";
import { sqlite } from "../db/index.js";
import { randomUUID } from "node:crypto";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "kojima2026";

export const checkpointRoutes = new Hono();

export function requireAdmin(c: any) {
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
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "Invalid body" }, 400);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const qrCodeValue = typeof body.qrCodeValue === "string" ? body.qrCodeValue.trim() : "";
  const order = body.order;
  const { lat, lng, imageUrl } = body;
  if (!name || !description || order == null || !qrCodeValue) {
    return c.json({ error: "Missing required fields: name, description, order, qrCodeValue" }, 400);
  }
  if (name.length > 80) return c.json({ error: "name must be at most 80 characters" }, 400);
  if (description.length > 400) return c.json({ error: "description must be at most 400 characters" }, 400);
  if (qrCodeValue.length > 256) return c.json({ error: "qrCodeValue must be at most 256 characters" }, 400);
  if (!Number.isInteger(order)) return c.json({ error: "order must be an integer" }, 400);
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
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "Invalid body" }, 400);
  const now = new Date().toISOString();
  const map: Record<string, string> = { name: "name", description: "description", order: '"order"', qrCodeValue: "qr_code_value", lat: "lat", lng: "lng", imageUrl: "image_url" };
  const fields: string[] = [];
  const values: any[] = [];
  for (const [k, col] of Object.entries(map)) {
    if (body[k] === undefined) continue;
    let value = body[k];
    if (k === "name" || k === "description" || k === "qrCodeValue") {
      if (typeof value !== "string") return c.json({ error: `${k} must be a string` }, 400);
      value = value.trim();
    }
    if (k === "name" && value.length > 80) return c.json({ error: "name must be at most 80 characters" }, 400);
    if (k === "description" && value.length > 400) return c.json({ error: "description must be at most 400 characters" }, 400);
    if (k === "qrCodeValue" && value.length > 256) return c.json({ error: "qrCodeValue must be at most 256 characters" }, 400);
    if (k === "order" && !Number.isInteger(value)) return c.json({ error: "order must be an integer" }, 400);
    fields.push(`${col} = ?`);
    values.push(value);
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
