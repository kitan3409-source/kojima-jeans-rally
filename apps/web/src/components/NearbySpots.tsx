import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGeolocation } from "../hooks/useGeolocation";
import { distanceMeters, formatDistance, toLatLng } from "../logic/geo";
import SpotMap from "./SpotMap";

type CheckpointLike = {
  id: string;
  name: string;
  description: string;
  order: number;
  lat: string | null;
  lng: string | null;
};

export default function NearbySpots({
  checkpoints,
  acquiredIds,
  limit = 3,
}: {
  checkpoints: CheckpointLike[];
  acquiredIds: Set<string>;
  limit?: number;
}) {
  const { position, status, error, request } = useGeolocation();
  const navigate = useNavigate();

  const ranked = useMemo(() => {
    if (!position) return [];
    const list: { cp: CheckpointLike; distance: number }[] = [];
    for (const cp of checkpoints) {
      const pos = toLatLng(cp);
      if (pos) list.push({ cp, distance: distanceMeters(position, pos) });
    }
    list.sort((a, b) => a.distance - b.distance);
    return list.slice(0, limit);
  }, [position, checkpoints, limit]);

  return (
    <section className="stack">
      <SpotMap
        checkpoints={checkpoints}
        acquiredIds={acquiredIds}
        userPosition={position}
        height={160}
        onSelect={(id) => navigate(`/spots/${id}`)}
      />

      <div className="section-title">近くのスポット</div>

      {status !== "granted" && (
        <button
          type="button"
          className="btn-secondary"
          onClick={request}
          disabled={status === "locating"}
          aria-busy={status === "locating"}
        >
          {status === "locating" ? "取得中..." : "現在地を取得"}
        </button>
      )}

      <div className="stack" style={{ gap: 4 }} aria-live="polite">
        {status === "locating" && (
          <p className="muted">現在地を取得しています...</p>
        )}
        {status !== "locating" && error && <p className="muted">{error}</p>}
        {status === "idle" && !position && !error && (
          <p className="muted">
            現在地を取得すると、近い順にスポットを表示します。
          </p>
        )}
        {status === "granted" && ranked.length === 0 && (
          <p className="muted">位置情報が登録されたスポットがありません。</p>
        )}
      </div>

      {ranked.map(({ cp, distance }) => {
        const acquired = acquiredIds.has(cp.id);
        return (
          <Link
            key={cp.id}
            to={"/spots/" + cp.id}
            className="list-row"
            style={{ alignItems: "center" }}
          >
            <span
              className="num"
              style={{
                fontSize: 18,
                color: "var(--fog-dim)",
                minWidth: 26,
                lineHeight: 1,
              }}
            >
              {cp.order}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{cp.name}</div>
              <div className="muted">{formatDistance(distance)}</div>
            </div>
            <span
              className={`badge ${
                acquired ? "badge-acquired" : "badge-pending"
              }`}
            >
              {acquired ? "獲得" : "未獲得"}
            </span>
          </Link>
        );
      })}
    </section>
  );
}
