import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "@kojima/shared/api";
import type { SurveyAnswer, SurveyQuestion, SurveyResults } from "@kojima/shared/types";

const TOKEN_KEY = "admin_token";

const tapButton: CSSProperties = {
  width: "auto",
  minHeight: 44,
  padding: "10px 14px",
  fontSize: 13,
  letterSpacing: "0.04em",
};

function answerText(q: SurveyQuestion, v: SurveyAnswer | undefined, spotName: Map<string, string>): string {
  if (v === undefined) return "";
  if (Array.isArray(v)) return v.join(" / ");
  if (q.type === "spot" && typeof v === "string") return spotName.get(v) ?? "(削除されたスポット)";
  return String(v);
}

function csvCell(value: string | number): string {
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function countOptions(q: SurveyQuestion, results: SurveyResults, spotName: Map<string, string>) {
  const labels =
    q.type === "scale"
      ? Array.from({ length: q.max - q.min + 1 }, (_, i) => String(q.min + i))
      : q.type === "spot"
        ? results.spots.map((s) => s.name)
        : q.type === "single" || q.type === "multi"
          ? [...q.options]
          : [];
  const counts = new Map(labels.map((l) => [l, 0]));
  let answered = 0;
  for (const r of results.responses) {
    const v = r.answers[q.id];
    if (v === undefined) continue;
    answered += 1;
    const values = Array.isArray(v) ? v : [q.type === "spot" ? answerText(q, v, spotName) : String(v)];
    for (const key of values) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return { counts: [...counts.entries()], answered };
}

export default function AdminSurveyPage() {
  const [token, setToken] = useState(sessionStorage.getItem(TOKEN_KEY) ?? "");
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(TOKEN_KEY));
  const [loginErr, setLoginErr] = useState<string | null>(null);
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const current = token.trim();
    if (!current) return;
    setLoading(true);
    setError(null);
    try {
      setResults(await api.getSurveyResults(current));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        setAuthed(false);
        setLoginErr("認証が切れました。再ログインしてください。");
      } else if (e instanceof ApiError && e.status === 429) {
        setError("試行回数が多すぎます。しばらく待ってからお試しください。");
      } else {
        setError("読み込みに失敗しました。");
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authed) void load();
  }, [authed, load]);

  const spotName = useMemo(
    () => new Map((results?.spots ?? []).map((s) => [s.id, s.name])),
    [results]
  );

  const login = () => {
    const value = token.trim();
    if (!value) {
      setLoginErr("パスワードを入力してください。");
      return;
    }
    sessionStorage.setItem(TOKEN_KEY, value);
    setToken(value);
    setLoginErr(null);
    setAuthed(true);
  };

  const downloadCsv = () => {
    if (!results) return;
    const header = ["回答日時", "ニックネーム", "獲得スタンプ数", ...results.questions.map((q) => q.label)];
    const rows = results.responses.map((r) => [
      new Date(r.updatedAt).toLocaleString("ja-JP"),
      r.nickname ?? "",
      r.stamps,
      ...results.questions.map((q) => answerText(q, r.answers[q.id], spotName)),
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kojima-survey-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!authed) {
    return (
      <div className="panel panel--stitch" style={{ maxWidth: 360, margin: "40px auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h1 className="display" style={{ textAlign: "center" }}>
            アンケート結果
          </h1>
          {loginErr && (
            <div className="notice notice--err" role="alert">
              {loginErr}
            </div>
          )}
          <label className="muted" htmlFor="admin-survey-token">
            管理者パスワード
          </label>
          <input
            id="admin-survey-token"
            className="field"
            type="password"
            autoComplete="current-password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") login();
            }}
          />
          <button type="button" className="btn-primary" onClick={login}>
            ログイン
          </button>
          <Link to="/admin" className="btn-ghost">
            管理コンソールへ戻る
          </Link>
        </div>
      </div>
    );
  }

  const total = results?.responses.length ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <h1 className="display" style={{ marginRight: "auto" }}>
          アンケート結果
        </h1>
        <button type="button" className="btn-secondary" onClick={load} disabled={loading} style={tapButton}>
          {loading ? "更新中…" : "更新"}
        </button>
        <button type="button" className="btn-secondary" onClick={downloadCsv} disabled={!total} style={tapButton}>
          CSV
        </button>
        <Link to="/admin" className="btn-ghost" style={tapButton}>
          管理コンソールへ
        </Link>
      </div>

      {error && (
        <div className="notice notice--err" role="alert">
          {error}
        </div>
      )}

      {!results && loading && <div className="skeleton" style={{ height: 200 }} />}

      {results && (
        <>
          <div className="stat">
            <div className="stat__value">{total.toLocaleString("ja-JP")}</div>
            <div className="stat__label">回答数</div>
          </div>

          {results.questions.map((q, idx) => {
            if (q.type === "text") {
              const comments = results.responses.filter((r) => typeof r.answers[q.id] === "string");
              return (
                <section key={q.id}>
                  <div className="section-title">
                    Q{idx + 1}. {q.label}（{comments.length}件）
                  </div>
                  {comments.map((r) => (
                    <div key={r.userId} className="list-row" style={{ alignItems: "flex-start", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 14, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                        {r.answers[q.id] as string}
                      </span>
                      <span className="muted">
                        {r.nickname || "ゲスト"} ・ {new Date(r.updatedAt).toLocaleString("ja-JP")}
                      </span>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="muted" style={{ textAlign: "center", padding: 16 }}>
                      まだありません。
                    </p>
                  )}
                </section>
              );
            }
            const { counts, answered } = countOptions(q, results, spotName);
            const max = counts.reduce((m, [, n]) => Math.max(m, n), 0);
            const avg =
              q.type === "scale" && answered > 0
                ? results.responses.reduce((sum, r) => sum + (typeof r.answers[q.id] === "number" ? (r.answers[q.id] as number) : 0), 0) /
                  answered
                : null;
            return (
              <section key={q.id} className="stack">
                <div className="section-title">
                  Q{idx + 1}. {q.label}（{answered}件）
                  {avg !== null && <span style={{ marginLeft: 8, color: "var(--thread)" }}>平均 {avg.toFixed(2)}</span>}
                </div>
                {counts.map(([label, n]) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 13.5, flex: 1 }}>{label}</span>
                      <span className="num muted">
                        {n}
                        {answered > 0 ? `（${Math.round((n / answered) * 100)}%）` : ""}
                      </span>
                    </div>
                    <div className="bar">
                      <div className="bar__fill" style={{ width: `${max > 0 ? (n / max) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
