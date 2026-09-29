import { getBadges } from "../logic/badges";

type Props = {
  checkpoints: { id: string; order: number }[];
  stamps: { checkpointId: string; acquiredAt: string }[];
};

export default function BadgeShelf({ checkpoints, stamps }: Props) {
  const badges = getBadges({ checkpoints, stamps });
  const earned = badges.filter((b) => b.earned).length;

  return (
    <section aria-label="実績バッジ">
      <div
        className="section-title"
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span>実績</span>
        <span className="muted" style={{ letterSpacing: "0.04em" }}>
          獲得済み {earned} / {badges.length}
        </span>
      </div>
      <div
        className="grid2"
        role="list"
        aria-label={`実績バッジ 獲得済み ${earned} / ${badges.length}`}
      >
        {badges.map((badge) => {
          const ratio = badge.target > 0 ? badge.progress / badge.target : 0;
          const remaining = Math.max(0, badge.target - badge.progress);
          return (
            <div
              key={badge.id}
              role="listitem"
              className={`badge-tile${badge.earned ? "" : " badge-tile--locked"}`}
              style={badge.earned ? { borderColor: "var(--thread)" } : undefined}
              aria-label={`${badge.name}。${badge.description}。${
                badge.earned ? "獲得済み" : `未獲得、あと${remaining}`
              }`}
            >
              <span className="badge-tile__mark" aria-hidden="true">
                {badge.mark}
              </span>
              <div className="display" style={{ fontSize: 14 }}>
                {badge.name}
              </div>
              <div className="muted">{badge.description}</div>
              <div
                className="bar"
                style={{ marginTop: "auto" }}
                aria-hidden="true"
              >
                <div
                  className="bar__fill"
                  style={{ width: `${Math.round(ratio * 100)}%` }}
                />
              </div>
              <div className="muted">
                {badge.earned ? "獲得済み" : `あと ${remaining}`}（
                {badge.progress}/{badge.target}）
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
