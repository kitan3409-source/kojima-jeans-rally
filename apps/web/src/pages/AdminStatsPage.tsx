import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";

type Stats = {
  totalUsers: number;
  totalStamps: number;
  totalCheckpoints: number;
  completions: number;
  completionRate: number;
  perCheckpoint: {
    checkpointId: string;
    name: string;
    order: number;
    count: number;
  }[];
  recent: { userId: string; checkpointId: string; acquiredAt: string }[];
};

type LeaderboardEntry = {
  rank: number;
  userId: string;
  nickname: string | null;
  stamps: number;
  completed: boolean;
  durationMs: number | null;
  lastAcquiredAt: string | null;
};

function shortId(id: string) {
  return id.slice(0, 8) + (id.length > 8 ? "…" : "");
}

function formatNumber(n: number) {
  return Number.isFinite(n) ? n.toLocaleString("ja-JP") : "0";
}

function formatDuration(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}時間${m}分` : `${m}分`;
}

function formatRelative(iso: string) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Date.now() - t;
  if (diff < 0) return "たった今";
  const sec = Math.floor(diff / 1000);
  if (sec < 10) return "たった今";
  if (sec < 60) return `${sec}秒前`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}分前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}時間前`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}日前`;
  return new Date(iso).toLocaleDateString("ja-JP");
}

function tapButton(): CSSProperties {
  return { width: "auto", minHeight: 44, padding: "10px 14px", fontSize: 13, letterSpacing: "0.04em" };
}

const liveStyle: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export default function AdminStatsPage() {
  const [token, setToken] = useState(localStorage.getItem("admin_token") ?? "");
  const [authed, setAuthed] = useState(() => !!localStorage.getItem("admin_token"));
  const [loginErr, setLoginErr] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const current = token.trim();
    if (!current) {
      setAuthed(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const headers = { "X-Admin-Token": current };
      const responses = await Promise.all([
        fetch("/api/stats", { headers }),
        fetch("/api/stats/leaderboard?limit=20", { headers }),
      ]);
      if (responses.some((r) => r.status === 401)) {
        setAuthed(false);
        setLoginErr("認証が切れました。再ログインしてください。");
        return;
      }
      if (responses.some((r) => !r.ok)) {
        setError("読み込みに失敗しました。");
        return;
      }
      const [s, lb] = await Promise.all(responses.map((r) => r.json()));
      setStats(s && typeof s === "object" ? (s as Stats) : null);
      setLeaderboard(Array.isArray(lb) ? (lb as LeaderboardEntry[]) : []);
      setUpdatedAt(new Date());
    } catch {
      setError("読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  const login = () => {
    const value = token.trim();
    if (!value) {
      setLoginErr("パスワードを入力してください。");
      return;
    }
    localStorage.setItem("admin_token", value);
    setToken(value);
    setLoginErr(null);
    setStats(null);
    setLeaderboard([]);
    setAuthed(true);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setAuthed(false);
    setStats(null);
    setLeaderboard([]);
    setError(null);
    setUpdatedAt(null);
  };

  if (!authed) {
    return (
      <div className="panel panel--stitch" style={{ maxWidth: 360, margin: "40px auto" }}>
        <div
          className="panel__body"
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <h1 className="display" style={{ textAlign: "center" }}>
            統計
          </h1>
          <p className="muted" style={{ textAlign: "center" }}>
            管理者パスワードを入力してください。
          </p>
          {loginErr && (
            <div className="notice notice--err" role="alert">
              {loginErr}
            </div>
          )}
          <label className="muted" htmlFor="admin-stats-token">
            パスワード
          </label>
          <input
            id="admin-stats-token"
            className="field"
            type="password"
            autoComplete="current-password"
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              if (loginErr) setLoginErr(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") login();
            }}
            placeholder="パスワード"
          />
          <button type="button" className="btn-primary" onClick={login}>
            ログイン
          </button>
          <Link
            to="/admin"
            className="btn-ghost"
            style={{ textDecoration: "none", minHeight: 44 }}
          >
            管理コンソールへ戻る
          </Link>
        </div>
      </div>
    );
  }

  const header = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <h1 className="display" style={{ marginRight: "auto" }}>
        統計
      </h1>
      {updatedAt && (
        <span className="muted" aria-hidden="true">
          最終更新 {formatRelative(updatedAt.toISOString())}
        </span>
      )}
      <button
        type="button"
        className="btn-secondary"
        onClick={load}
        disabled={loading}
        style={tapButton()}
      >
        {loading ? "更新中…" : "更新"}
      </button>
      <button type="button" className="btn-ghost" onClick={logout} style={tapButton()}>
        ログアウト
      </button>
      <Link
        to="/admin"
        className="btn-ghost"
        style={{ ...tapButton(), textDecoration: "none" }}
      >
        管理コンソールへ
      </Link>
    </div>
  );

  const live = (
    <p aria-live="polite" style={liveStyle}>
      {loading
        ? "統計を読み込み中"
        : stats
          ? `統計を更新しました。参加者${formatNumber(stats.totalUsers)}人、総獲得${formatNumber(stats.totalStamps)}件。`
          : ""}
    </p>
  );

  if (loading && !stats) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {header}
        {live}
        <div className="grid2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 88 }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 180 }} />
        <div className="skeleton" style={{ height: 180 }} />
      </div>
    );
  }

  if ((error && !stats) || !stats) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {header}
        {live}
        <div className="notice notice--err" role="alert">
          {error ?? "データがありません。"}
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={load}
          disabled={loading}
          style={{ minHeight: 44 }}
        >
          再読み込み
        </button>
      </div>
    );
  }

  const perCheckpoint = Array.isArray(stats.perCheckpoint)
    ? [...stats.perCheckpoint].sort((a, b) => a.order - b.order)
    : [];
  const maxCount = perCheckpoint.reduce((max, cp) => Math.max(max, cp.count), 0);
  const nameById = new Map(perCheckpoint.map((cp) => [cp.checkpointId, cp.name]));
  const recent = Array.isArray(stats.recent)
    ? [...stats.recent].sort(
        (a, b) => new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime()
      )
    : [];
  const completionPct = Number.isFinite(stats.completionRate)
    ? stats.completionRate * 100
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {header}
      {live}

      {error && (
        <div className="notice notice--err" role="alert">
          {error}
        </div>
      )}

      <div className="grid2">
        <div className="stat">
          <div className="stat__value">{formatNumber(stats.totalUsers)}</div>
          <div className="stat__label">参加者数</div>
        </div>
        <div className="stat">
          <div className="stat__value">{formatNumber(stats.totalStamps)}</div>
          <div className="stat__label">総獲得数</div>
        </div>
        <div className="stat">
          <div className="stat__value">{formatNumber(stats.completions)}</div>
          <div className="stat__label">制覇者数</div>
        </div>
        <div className="stat">
          <div className="stat__value">
            {completionPct.toLocaleString("ja-JP", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
            %
          </div>
          <div className="stat__label">制覇率</div>
        </div>
      </div>

      <section className="stack">
        <div className="section-title">スポット別 獲得数</div>
        {perCheckpoint.map((cp) => {
          const pct = maxCount > 0 ? (cp.count / maxCount) * 100 : 0;
          return (
            <div
              key={cp.checkpointId}
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span className="display" style={{ fontSize: 13, flex: 1 }}>
                  {cp.order}. {cp.name}
                </span>
                <span className="num muted">
                  {formatNumber(cp.count)} / {formatNumber(stats.totalStamps)}
                </span>
              </div>
              <div className="bar">
                <div className="bar__fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        {perCheckpoint.length === 0 && (
          <p className="muted" style={{ textAlign: "center", padding: 16 }}>
            スポットがありません。
          </p>
        )}
      </section>

      <section>
        <div className="section-title">最近の獲得</div>
        {recent.map((r, i) => (
          <div
            key={`${r.userId}-${r.checkpointId}-${r.acquiredAt}-${i}`}
            className="list-row"
          >
            <span className="num" style={{ fontSize: 12, color: "var(--fog-dim)" }}>
              {shortId(r.userId)}
            </span>
            <span style={{ flex: 1, fontSize: 13 }}>
              {nameById.get(r.checkpointId) ?? r.checkpointId}
            </span>
            <span
              className="muted"
              title={new Date(r.acquiredAt).toLocaleString("ja-JP")}
            >
              {formatRelative(r.acquiredAt)}
            </span>
          </div>
        ))}
        {recent.length === 0 && (
          <p className="muted" style={{ textAlign: "center", padding: 16 }}>
            まだ獲得がありません。
          </p>
        )}
      </section>

      <section>
        <div className="section-title">リーダーボード</div>
        {leaderboard.map((e) => (
          <div key={e.userId} className="list-row">
            <span className="num" style={{ width: 28, color: "var(--fog-dim)" }}>
              {e.rank}
            </span>
            <span style={{ flex: 1, fontSize: 13 }}>{e.nickname || "ゲスト"}</span>
            {e.completed && <span className="chip chip--on">制覇</span>}
            <span className="num" style={{ fontSize: 13 }}>
              {formatNumber(e.stamps)}
            </span>
            {e.durationMs != null && (
              <span className="muted">{formatDuration(e.durationMs)}</span>
            )}
          </div>
        ))}
        {leaderboard.length === 0 && (
          <p className="muted" style={{ textAlign: "center", padding: 16 }}>
            まだ記録がありません。
          </p>
        )}
      </section>
    </div>
  );
}
