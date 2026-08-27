import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import JeansStamp from "../components/JeansStamp";
import { useDeviceId } from "../hooks/useDeviceId";

export default function CompletePage() {
  const deviceId = useDeviceId();
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [stamps, setStamps] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/checkpoints").then((r) => r.json()).then(setCheckpoints).catch(() => {});
    if (deviceId) fetch(`/api/stamps/${deviceId}`).then((r) => r.json()).then(setStamps).catch(() => {});
  }, [deviceId]);

  const acquiredIds = new Set(stamps.map((s: any) => s.checkpointId));
  const isComplete = checkpoints.length > 0 && acquiredIds.size === checkpoints.length;

  const shareText = `児島ジーンズスタンプラリーをコンプリートしました！👖🎉 #児島ジーンズラリー #倉敷市児島`;

  return (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
      {isComplete ? (
        <>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.8 }}>
            <div style={{ fontSize: 48 }}>🎉👖🎉</div>
            <h2 style={{ fontSize: 22, marginTop: 8 }}>コンプリート！</h2>
            <p style={{ color: "#6b7280", marginTop: 8 }}>すべてのピースを集めました！<br />児島を巡ってくれてありがとう！</p>
          </motion.div>

          {/* confetti */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ fontSize: 24 }}>
            ✨🎊✨🎊✨
          </motion.div>

          <JeansStamp checkpoints={checkpoints} acquiredIds={acquiredIds} />

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              className="btn-primary"
              onClick={() => {
                if (navigator.share) navigator.share({ title: "児島ジーンズスタンプラリー", text: shareText }).catch(() => {});
                else navigator.clipboard.writeText(shareText).then(() => alert("シェア用テキストをコピーしました！"));
              }}
            >
              📤 シェアする
            </button>
            <Link to="/stamps" className="btn-secondary" style={{ display: "block" }}>マイスタンプに戻る</Link>
          </div>
        </>
      ) : (
        <>
          <p style={{ padding: 40, color: "#6b7280" }}>まだコンプリートしていません。<br />{acquiredIds.size} / {checkpoints.length} ピース獲得</p>
          <JeansStamp checkpoints={checkpoints} acquiredIds={acquiredIds} />
          <Link to="/scan" className="btn-primary" style={{ display: "block" }}>QRを読み取る</Link>
        </>
      )}
    </div>
  );
}
