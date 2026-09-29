import { Link, useParams } from "react-router-dom";
import SpotMap from "../components/SpotMap";
import { useGeolocation } from "../hooks/useGeolocation";
import { useRally } from "../hooks/useRally";
import { distanceMeters, formatDistance, toLatLng } from "../logic/geo";

const tapArea = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 44,
} as const;

export default function SpotDetailPage() {
  const { id } = useParams();
  const { checkpoints, stamps, acquiredIds, loading } = useRally();
  const { position, status, error, request } = useGeolocation();

  if (loading) {
    return (
      <p className="muted" style={{ textAlign: "center", padding: 40 }}>
        読み込み中...
      </p>
    );
  }

  const checkpoint = checkpoints.find((c) => c.id === id);

  if (!checkpoint) {
    return (
      <div className="stack" style={{ textAlign: "center", padding: 40 }}>
        <p>スポットが見つかりません。</p>
        <Link to="/" className="btn-secondary">
          トップに戻る
        </Link>
      </div>
    );
  }

  const stamp = stamps.find((s) => s.checkpointId === checkpoint.id);
  const pos = toLatLng(checkpoint);
  const distance = position && pos ? distanceMeters(position, pos) : null;

  return (
    <div className="stack" style={{ gap: 20 }}>
      <Link to="/stamps" className="muted" style={tapArea}>
        ルート
      </Link>

      <div>
        <h1 className="display">{checkpoint.name}</h1>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <span className="tag">{checkpoint.order}番目</span>
          <span
            className={`badge ${
              stamp ? "badge-acquired" : "badge-pending"
            }`}
          >
            {stamp ? "取得済み" : "未取得"}
          </span>
        </div>
      </div>

      <p className="lead">{checkpoint.description}</p>

      {stamp && (
        <p className="muted">
          {new Date(stamp.acquiredAt).toLocaleString("ja-JP")} 獲得
        </p>
      )}

      <div className="panel panel--stitch stack">
        {distance !== null ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span className="muted">現在地から</span>
            <span className="num" style={{ fontSize: 22, lineHeight: 1 }}>
              {formatDistance(distance)}
            </span>
          </div>
        ) : !pos ? (
          <p className="muted">
            このスポットには位置情報が登録されていません。現地の案内表示をご確認ください。
          </p>
        ) : (
          <>
            {status === "locating" ? (
              <p className="muted">現在地を取得しています...</p>
            ) : error ? (
              <p className="muted">{error}</p>
            ) : (
              <p className="muted">現在地を取得すると距離を表示します。</p>
            )}
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
          </>
        )}
      </div>

      <SpotMap
        checkpoints={checkpoints}
        acquiredIds={acquiredIds}
        userPosition={position}
        height={200}
        highlightId={checkpoint.id}
      />

      {pos ? (
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${pos.lat},${pos.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={tapArea}
        >
          Googleマップで開く
        </a>
      ) : (
        <p className="notice notice--err">
          位置情報が無いため、地図アプリでの案内を表示できません。
        </p>
      )}

      <Link to="/stamps" className="btn-secondary" style={tapArea}>
        ルートに戻る
      </Link>
    </div>
  );
}
