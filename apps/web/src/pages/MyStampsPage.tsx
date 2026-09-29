import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import JeansStamp from "../components/JeansStamp";
import BadgeShelf from "../components/BadgeShelf";
import NearbySpots from "../components/NearbySpots";
import { useRally } from "../hooks/useRally";

type Filter = "all" | "done" | "todo";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "done", label: "獲得済み" },
  { key: "todo", label: "未獲得" },
];

export default function MyStampsPage() {
  const { checkpoints, stamps, acquiredIds, total, done, isComplete, loading } =
    useRally();
  const [filter, setFilter] = useState<Filter>("all");
  const [doneFirst, setDoneFirst] = useState(true);

  const stampByCheckpoint = useMemo(() => {
    const map = new Map<string, { acquiredAt: string }>();
    for (const stamp of stamps) map.set(stamp.checkpointId, stamp);
    return map;
  }, [stamps]);

  const visible = useMemo(() => {
    const list = checkpoints.filter((cp) => {
      const acquired = acquiredIds.has(cp.id);
      if (filter === "done") return acquired;
      if (filter === "todo") return !acquired;
      return true;
    });
    list.sort((a, b) => {
      if (doneFirst) {
        const da = acquiredIds.has(a.id) ? 0 : 1;
        const db = acquiredIds.has(b.id) ? 0 : 1;
        if (da !== db) return da - db;
      }
      return a.order - b.order;
    });
    return list;
  }, [checkpoints, acquiredIds, filter, doneFirst]);

  if (loading) {
    return (
      <div
        aria-busy="true"
        aria-label="集めたスタンプを読み込み中"
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div className="skeleton" style={{ height: 40, width: "55%" }} />
        <div className="skeleton" style={{ height: 280 }} />
        <div
          className="skeleton"
          style={{ height: 64, width: "70%", margin: "0 auto" }}
        />
        <div className="skeleton" style={{ height: 96 }} />
        <div className="skeleton" style={{ height: 96 }} />
      </div>
    );
  }

  const remaining = total - done;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <div>
        <h1 className="display">集めたスタンプ</h1>
        <p className="muted" style={{ marginTop: 6 }}>
          獲得済み {done} / {total}
          {remaining > 0 ? `（残り ${remaining}）` : ""}
        </p>
      </div>

      <JeansStamp checkpoints={checkpoints} acquiredIds={acquiredIds} />

      <div style={{ textAlign: "center" }}>
        <div
          className="num"
          style={{ fontSize: 44, lineHeight: 1, fontWeight: 600 }}
        >
          {done}
          <span
            style={{
              fontSize: 15,
              color: "var(--fog-dim)",
              marginLeft: 6,
              fontWeight: 400,
              letterSpacing: "0.08em",
            }}
          >
            / {total}
          </span>
        </div>
        <p className="muted" style={{ marginTop: 8 }}>
          {isComplete
            ? "一本、染め上がりました。"
            : done === 0
            ? "最初のQRコードを読み取ってみましょう。"
            : "残りのピースも、児島のどこかで待っています。"}
        </p>
      </div>

      {isComplete && (
        <Link to="/complete" className="btn-primary">
          完成したジーンズを見る
        </Link>
      )}

      <BadgeShelf checkpoints={checkpoints} stamps={stamps} />

      <NearbySpots
        checkpoints={checkpoints}
        acquiredIds={acquiredIds}
        limit={3}
      />

      <section>
        <div className="section-title">ルート</div>
        <div
          role="group"
          aria-label="スタンプの絞り込みと並び順"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            margin: "12px 0 4px",
          }}
        >
          {FILTERS.map((item) => {
            const on = filter === item.key;
            const count =
              item.key === "done" ? done : item.key === "todo" ? remaining : total;
            return (
              <button
                key={item.key}
                type="button"
                className={`chip${on ? " chip--on" : ""}`}
                aria-pressed={on}
                onClick={() => setFilter(item.key)}
                style={{ minHeight: 44 }}
              >
                {item.label} {count}
              </button>
            );
          })}
          <button
            type="button"
            className={`chip${doneFirst ? " chip--on" : ""}`}
            aria-pressed={doneFirst}
            onClick={() => setDoneFirst((v) => !v)}
            style={{ minHeight: 44 }}
          >
            獲得済みを先に
          </button>
        </div>

        <div className="timeline">
          {visible.map((cp) => {
            const stamp = stampByCheckpoint.get(cp.id);
            const acquired = !!stamp;
            return (
              <div
                key={cp.id}
                className={`stop ${acquired ? "stop--done" : "stop--todo"}`}
              >
                <span className="stop__no" aria-hidden="true">
                  {cp.order}
                </span>
                <div style={{ paddingRight: 52 }}>
                  <Link
                    to={`/spots/${cp.id}`}
                    className="stop__name"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      minHeight: 44,
                    }}
                  >
                    {cp.name}
                  </Link>
                  <div className="stop__desc">{cp.description}</div>
                  {stamp && (
                    <div className="stop__date">
                      {new Date(stamp.acquiredAt).toLocaleString("ja-JP")} 獲得
                    </div>
                  )}
                </div>
                <span
                  className={`badge stop__badge ${
                    acquired ? "badge-acquired" : "badge-pending"
                  }`}
                >
                  {acquired ? "獲得" : "未獲得"}
                </span>
              </div>
            );
          })}
          {visible.length === 0 && (
            <p className="muted" style={{ textAlign: "center", padding: 20 }}>
              {checkpoints.length === 0
                ? "スポットがまだ登録されていません。"
                : filter === "done"
                ? "獲得済みのスタンプはまだありません。"
                : filter === "todo"
                ? "未獲得のスタンプはありません。すべて集めました。"
                : "表示できるスタンプがありません。"}
            </p>
          )}
        </div>
      </section>

      <div className="stack">
        <Link to="/scan" className="btn-secondary">
          QRコードを読み取る
        </Link>
        <Link to="/profile" className="btn-ghost">
          プロフィール設定
        </Link>
      </div>
    </div>
  );
}
