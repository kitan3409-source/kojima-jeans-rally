import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import JeansStamp from "../components/JeansStamp";
import { useDeviceId } from "../hooks/useDeviceId";

export default function MyStampsPage() {
  const deviceId = useDeviceId();
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [stamps, setStamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) return;
    Promise.all([
      fetch("/api/checkpoints").then((r) => r.json()),
      fetch(`/api/stamps/${deviceId}`).then((r) => r.json()),
    ]).then(([cps, sts]) => { setCheckpoints(cps); setStamps(sts); setLoading(false); }).catch(() => setLoading(false));
  }, [deviceId]);

  if (loading) return <p style={{ textAlign: "center", padding: 40 }}>読み込み中...</p>;

  const acquiredIds = new Set(stamps.map((s) => s.checkpointId));
  const isComplete = checkpoints.length > 0 && acquiredIds.size === checkpoints.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 style={{ textAlign: "center" }}>マイスタンプ</h2>

      <JeansStamp checkpoints={checkpoints} acquiredIds={acquiredIds} />

      <p style={{ textAlign: "center", fontWeight: 700, fontSize: 18 }}>
        {acquiredIds.size} / {checkpoints.length} ピース獲得 👖
      </p>

      {isComplete && (
        <Link to="/complete" className="btn-primary" style={{ textAlign: "center", display: "block" }}>
          🎉 コンプリート画面を見る
        </Link>
      )}

      <Link to="/scan" className="btn-secondary" style={{ textAlign: "center", display: "block" }}>
        QRを読み取る
      </Link>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {checkpoints.map((cp) => {
          const stamp = stamps.find((s) => s.checkpointId === cp.id);
          const acquired = !!stamp;
          return (
            <div key={cp.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{cp.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{cp.description}</div>
                {acquired && <div style={{ fontSize: 11, color: "#16a34a", marginTop: 4 }}>獲得: {new Date(stamp.acquiredAt).toLocaleString("ja-JP")}</div>}
              </div>
              <span className={`badge ${acquired ? "badge-acquired" : "badge-pending"}`}>{acquired ? "獲得済み" : "未獲得"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
