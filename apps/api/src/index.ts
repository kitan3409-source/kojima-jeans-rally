import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import { secureHeaders } from "hono/secure-headers";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { checkpointRoutes } from "./routes/checkpoints.js";
import { stampRoutes } from "./routes/stamps.js";
import { statsRoutes } from "./routes/stats.js";
import { profileRoutes } from "./routes/profiles.js";
import { sqlite } from "./db/index.js";
import QRCode from "qrcode";
import path from "node:path";
import { allowedOrigins, webDistDir } from "./config.js";
import { requireAdmin } from "./security.js";
import "./db/migrate.js";

const app = new Hono();

const USER_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

app.use("/*", secureHeaders());
app.use("/*", bodyLimit({ maxSize: 16 * 1024 }));
app.use(
  "/*",
  cors({
    origin: (origin) => (allowedOrigins.includes(origin) ? origin : null),
    allowHeaders: ["Content-Type", "X-Admin-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: false,
  })
);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

app.get("/api/health", (c) => c.json({ ok: true }));
app.route("/api/checkpoints", checkpointRoutes);
app.route("/api/stamps", stampRoutes);
app.route("/api/stats", statsRoutes);
app.route("/api/profile", profileRoutes);

app.get("/api/admin/verify", (c) => {
  const err = requireAdmin(c);
  if (err) return err;
  return c.json({ ok: true });
});

app.get("/api/users/ensure/:userId", async (c) => {
  const userId = c.req.param("userId");
  if (!USER_ID_PATTERN.test(userId)) return c.json({ error: "userId format is invalid" }, 400);
  const row = sqlite.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as any;
  if (row) return c.json({ id: row.id });
  sqlite.prepare(`INSERT INTO users (id, created_at) VALUES (?, ?)`).run(userId, new Date().toISOString());
  return c.json({ id: userId });
});

app.get("/api/qr/:checkpointId", async (c) => {
  const err = requireAdmin(c);
  if (err) return err;
  const id = c.req.param("checkpointId");
  const cp = sqlite.prepare(`SELECT * FROM checkpoints WHERE id = ?`).get(id) as any;
  if (!cp) return c.json({ error: "Not found" }, 404);
  const png = await QRCode.toBuffer(cp.qr_code_value, { width: 400, margin: 1 });
  return new Response(png as any, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="qr-${id}.png"`,
    },
  });
});

if (webDistDir) {
  const root = webDistDir;
  app.use("/*", serveStatic({ root }));
  app.get("*", async (c, next) => {
    if (c.req.path.startsWith("/api/") || path.extname(c.req.path)) return next();
    return serveStatic({ root, path: "index.html" })(c, next);
  });
}

const port = Number(process.env.PORT ?? 3000);
console.log(`API listening on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
