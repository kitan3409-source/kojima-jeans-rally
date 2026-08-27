import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import QRScanner from "../components/QRScanner";
import JeansStamp from "../components/JeansStamp";
import { useDeviceId } from "../hooks/useDeviceId";

export default function ScanPage() {
  const deviceId = useDeviceId();
  const navigate = useNavigate();
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [stamps, setStamps] = useState<any[]>([]);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [pendingComplete, setPendingComplete] = useState(false);
  const [manualValue, setManualValue] = useState("");

  useEffect(() => {
    fetch("/api/checkpoints").then((r) => r.json()).then(setCheckpoints).catch(() => {});
    if (deviceId) fetch(`/api/stamps/${deviceId}`).then((r) => r.json()).then(setStamps).catch(() => {});
  }, [deviceId]);

  const acquiredIds = new Set(stamps.map((s: any) => s.checkpointId));

  const playSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.connect(gain); gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  const handleScan = async (value: string) => {
    if (!deviceId) return;
    try {
      const res = await fetch("/api/stamps/acquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deviceId, qrCodeValue: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) setMsg({ type: "error", text: "このスポットはすでに獲得済みです！" });
        else if (res.status === 404) setMsg({ type: "error", text: "無効なQRコードです。" });
        else setMsg({ type: "error", text: data.error ?? "エラーが発生しました" });
        return;
      }
      setMsg({ type: "success", text: `🎉 「${data.checkpoint.name}」を獲得！` });
      const newStamp = data.stamp;
      setStamps((prev) => [...prev, newStamp]);
      setAnimatingId(data.checkpoint.id);
      playSound();
      // check if complete after this
      const willBeComplete = acquiredIds.size + 1 === checkpoints.length;
      if (willBeComplete) setPendingComplete(true);
    } catch {
      setMsg({ type: "error", text: "通信エラーが発生しました" });
    }
  };

  const handleAnimComplete = () => {
    setAnimatingId(null);
    if (pendingComplete) {
      setPendingComplete(false);
      setTimeout(() => navigate("/complete"), 400);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 style={{ textAlign: "center" }}>QR読み取り</h2>

      {animatingId && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <JeansStamp checkpoints={checkpoints} acquiredIds={new Set([...acquiredIds, animatingId!])} animatingId={animatingId} onAnimationComplete={handleAnimComplete} />
        </div>
      )}

      {msg && (
        <div style={{ padding: 12, borderRadius: 12, textAlign: "center", fontWeight: 600, background: msg.type === "success" ? "#dcfce7" : "#fee2e2", color: msg.type === "success" ? "#166534" : "#991b1b" }}>
          {msg.text}
        </div>
      )}

      <QRScanner onScan={handleScan} onError={(m) => setMsg({ type: "error", text: m })} />

      <div className="card" style={{ display: "flex", gap: 8 }}>
        <input
          value={manualValue}
          onChange={(e) => setManualValue(e.target.value)}
          placeholder="QRの値を手入力（テスト用）"
          style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }}
        />
        <button className="btn-secondary" onClick={() => { if (manualValue.trim()) { handleScan(manualValue.trim()); setManualValue(""); } }} style={{ whiteSpace: "nowrap" }}>
          獲得
        </button>
      </div>

      <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.7 }}>
        <strong>テスト用QR値:</strong>
        <ul style={{ paddingLeft: 16, marginTop: 4 }}>
          {checkpoints.map((cp) => (
            <li key={cp.id} style={{ wordBreak: "break-all" }}>{cp.qrCodeValue}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
