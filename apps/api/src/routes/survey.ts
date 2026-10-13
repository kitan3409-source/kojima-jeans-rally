import { Hono } from "hono";
import { sqlite } from "../db/index.js";
import { createRateLimiter, rateLimit, requireAdmin } from "../security.js";

export const surveyRoutes = new Hono();

type Question =
  | { id: string; type: "scale"; label: string; required: boolean; min: number; max: number; minLabel: string; maxLabel: string }
  | { id: string; type: "single" | "multi"; label: string; required: boolean; options: string[] }
  | { id: string; type: "spot"; label: string; required: boolean }
  | { id: string; type: "text"; label: string; required: boolean; maxLength: number };

type Answer = number | string | string[];

export const SURVEY_QUESTIONS: Question[] = [
  { id: "satisfaction", type: "scale", label: "スタンプラリーの満足度を教えてください", required: true, min: 1, max: 5, minLabel: "不満", maxLabel: "とても満足" },
  { id: "favoriteSpot", type: "spot", label: "一番良かったスポットはどこですか", required: false },
  {
    id: "trigger",
    type: "multi",
    label: "参加したきっかけは何ですか（複数選択可）",
    required: false,
    options: ["SNS", "友人・知人の紹介", "ポスター・チラシ", "観光案内所", "ウェブサイト", "たまたま見かけた", "その他"],
  },
  { id: "companion", type: "single", label: "どなたと参加しましたか", required: false, options: ["ひとり", "家族", "友人", "恋人・パートナー", "職場・団体"] },
  { id: "age", type: "single", label: "年代を教えてください", required: false, options: ["10代以下", "20代", "30代", "40代", "50代", "60代以上"] },
  {
    id: "residence",
    type: "single",
    label: "お住まいはどちらですか",
    required: false,
    options: ["倉敷市内", "岡山県内（倉敷市外）", "中国・四国地方（岡山県外）", "その他の国内", "海外"],
  },
  { id: "revisit", type: "single", label: "また児島に来たいと思いますか", required: false, options: ["ぜひ来たい", "機会があれば来たい", "わからない", "来ないと思う"] },
  { id: "comment", type: "text", label: "ご意見・ご感想をご自由にお書きください", required: false, maxLength: 500 },
];

const USER_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;
const surveyLimiter = createRateLimiter(10, 60 * 1000);

function sanitizeText(value: string): string {
  return value.replace(/[\p{Cc}\p{Cf}]/gu, (ch) => (ch === "\n" ? "\n" : "")).trim();
}

function validateAnswers(input: unknown): { answers: Record<string, Answer> } | { error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "answers must be an object" };
  const raw = input as Record<string, unknown>;
  const answers: Record<string, Answer> = {};
  const spotIds = new Set(
    (sqlite.prepare(`SELECT id FROM checkpoints`).all() as { id: string }[]).map((r) => r.id)
  );

  for (const q of SURVEY_QUESTIONS) {
    const v = raw[q.id];
    const empty = v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
    if (empty) {
      if (q.required) return { error: `${q.id} is required` };
      continue;
    }
    switch (q.type) {
      case "scale":
        if (typeof v !== "number" || !Number.isInteger(v) || v < q.min || v > q.max) return { error: `${q.id} is invalid` };
        answers[q.id] = v;
        break;
      case "single":
        if (typeof v !== "string" || !q.options.includes(v)) return { error: `${q.id} is invalid` };
        answers[q.id] = v;
        break;
      case "multi": {
        if (!Array.isArray(v) || v.some((x) => typeof x !== "string" || !q.options.includes(x))) return { error: `${q.id} is invalid` };
        answers[q.id] = q.options.filter((o) => v.includes(o));
        break;
      }
      case "spot":
        if (typeof v !== "string" || !spotIds.has(v)) return { error: `${q.id} is invalid` };
        answers[q.id] = v;
        break;
      case "text": {
        if (typeof v !== "string") return { error: `${q.id} is invalid` };
        const text = sanitizeText(v);
        if (text.length > q.maxLength) return { error: `${q.id} must be at most ${q.maxLength} characters` };
        if (text) answers[q.id] = text;
        break;
      }
    }
  }
  return { answers };
}

function parseAnswers(json: string): Record<string, Answer> {
  try {
    const v = JSON.parse(json);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

surveyRoutes.get("/questions", (c) => c.json(SURVEY_QUESTIONS));

surveyRoutes.get("/responses", (c) => {
  const err = requireAdmin(c);
  if (err) return err;
  const rows = sqlite.prepare(`
    SELECT r.user_id, r.answers, r.created_at, r.updated_at, p.nickname,
      (SELECT COUNT(*) FROM stamp_records s WHERE s.user_id = r.user_id) AS stamps
    FROM survey_responses r
    LEFT JOIN profiles p ON p.user_id = r.user_id
    ORDER BY r.updated_at DESC
  `).all() as any[];
  const totalCheckpoints = (sqlite.prepare(`SELECT COUNT(*) AS n FROM checkpoints`).get() as any).n;
  const spots = (sqlite.prepare(`SELECT id, name, "order" FROM checkpoints ORDER BY "order" ASC`).all() as any[]).map((r) => ({
    id: r.id,
    name: r.name,
    order: r.order,
  }));
  return c.json({
    questions: SURVEY_QUESTIONS,
    spots,
    totalCheckpoints,
    responses: rows.map((r) => ({
      userId: r.user_id,
      nickname: r.nickname ?? null,
      stamps: r.stamps,
      answers: parseAnswers(r.answers),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  });
});

surveyRoutes.get("/:userId", (c) => {
  const userId = c.req.param("userId");
  if (!USER_ID_PATTERN.test(userId)) return c.json({ error: "userId format is invalid" }, 400);
  const row = sqlite.prepare(`SELECT * FROM survey_responses WHERE user_id = ?`).get(userId) as any;
  if (!row) return c.json({ userId, answers: null });
  return c.json({ userId, answers: parseAnswers(row.answers), updatedAt: row.updated_at });
});

surveyRoutes.put("/:userId", async (c) => {
  const limited = rateLimit(c, surveyLimiter, "survey");
  if (limited) return limited;
  const userId = c.req.param("userId");
  if (!USER_ID_PATTERN.test(userId)) return c.json({ error: "userId format is invalid" }, 400);
  const body = await c.req.json().catch(() => null);
  const result = validateAnswers(body?.answers);
  if ("error" in result) return c.json({ error: result.error }, 400);

  const now = new Date().toISOString();
  if (!sqlite.prepare(`SELECT id FROM users WHERE id = ?`).get(userId)) {
    sqlite.prepare(`INSERT INTO users (id, created_at) VALUES (?, ?)`).run(userId, now);
  }
  sqlite.prepare(`
    INSERT INTO survey_responses (user_id, answers, created_at, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET answers = excluded.answers, updated_at = excluded.updated_at
  `).run(userId, JSON.stringify(result.answers), now, now);
  return c.json({ userId, answers: result.answers, updatedAt: now });
});
