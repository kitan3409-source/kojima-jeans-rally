import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { checkpointRoutes } from "./routes/checkpoints.js";
import { stampRoutes } from "./routes/stamps.js";
import { sqlite } from "./db/index.js";
import QRCode from "qrcode";
import "./db/migrate.js";

const app = new Hono();

app.use("/*", cors({ origin: "*", allowHeaders: ["Content-Type", "X-Admin-Token"], allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }));
app.get("/api/health", (c) => c.json({ ok: true }));
app.route("/api/checkpoints", checkpointRoutes);
app.route("/api/stamps", stampRoutes);

app.get("/api/users/ensure/:userId", async (c) => {
  const userId = c.req.param("userId");
  const row = sqlite.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as any;
  if (row) return c.json({ id: row.id });
  sqlite.prepare(`INSERT INTO users (id, created_at) VALUES (?, ?)`).run(userId, new Date().toISOString());
  return c.json({ id: userId });
});

app.get("/api/qr/:checkpointId", async (c) => {
  const id = c.req.param("checkpointId");
  const cp = sqlite.prepare(`SELECT * FROM checkpoints WHERE id = ?`).get(id) as any;
  if (!cp) return c.json({ error: "Not found" }, 404);
  const png = await QRCode.toBuffer(cp.qr_code_value, { width: 400, margin: 1 });
  return new Response(png as any, { headers: { "Content-Type": "image/png", "Content-Disposition": `inline; filename="qr-${id}.png"` } });
});

const port = Number(process.env.PORT ?? 3000);
console.log(`API listening on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
