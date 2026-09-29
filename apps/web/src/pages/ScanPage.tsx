import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRScanner from "../components/QRScanner";
import JeansStamp from "../components/JeansStamp";
import { useRally } from "../hooks/useRally";

export default function ScanPage() {
  const { deviceId, checkpoints, setStamps, acquiredIds, total, done } =
    useRally();
  const navigate = useNavigate();
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [pendingComplete, setPendingComplete] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const [sending, setSending] = useState(false);
  const [retryable, setRetryable] = useState(false);
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" && navigator.onLine === false
  );
  const sendingRef = useRef(false);
  const lastValueRef = useRef<string | null>(null);

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const playSound = () => {
    try {
      const ctx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 660;
      osc.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      /* audio unavailable */
    }
  };

  const handleScan = async (value: string) => {
    if (!deviceId || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setRetryable(false);
    lastValueRef.current = value;
    try {
      const res = await fetch("/api/stamps/acquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deviceId, qrCodeValue: value }),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok) {
        if (res.status === 409)
          setMsg({ type: "error", text: "このスポットはすでに獲得しています。" });
        else if (res.status === 404)
          setMsg({ type: "error", text: "このQRコードは登録されていません。" });
        else if (res.status === 400)
          setMsg({ type: "error", text: "入力内容を確認してください。" });
        else
          setMsg({
            type: "error",
            text: "獲得できませんでした。もう一度お試しください。",
          });
        return;
      }
      setMsg({
        type: "success",
        text: `「${data.checkpoint.name}」のピースが藍に染まりました。`,
      });
      setStamps((prev) => [...prev, data.stamp]);
      setAnimatingId(data.checkpoint.id);
      playSound();
      if (acquiredIds.size + 1 === total) setPendingComplete(true);
    } catch {
      setRetryable(true);
      setMsg({
        type: "error",
        text:
          navigator.onLine === false
            ? "オフラインです。通信できる場所で再試行してください。"
            : "通信できませんでした。再試行してください。",
      });
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const retry = () => {
    if (lastValueRef.current) void handleScan(lastValueRef.current);
  };

  const submitManual = () => {
    const value = manualValue.trim();
    if (!value || sending) return;
    setManualValue("");
    void handleScan(value);
  };

  const handleAnimComplete = () => {
    setAnimatingId(null);
    if (pendingComplete) {
      setPendingComplete(false);
      setTimeout(() => navigate("/complete"), 500);
    }
  };

  const remaining = Math.max(total - done, 0);

  if (animatingId) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          textAlign: "center",
        }}
      >
        <h1 className="display">獲得しました</h1>
        <p className="lead" role="status" aria-live="polite">
          {msg?.text}
        </p>
        <JeansStamp
          checkpoints={checkpoints}
          acquiredIds={new Set([...acquiredIds, animatingId])}
          animatingId={animatingId}
          onAnimationComplete={handleAnimComplete}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h1 className="display">QRコードを読み取る</h1>
        <p className="lead" style={{ marginTop: 6 }}>
          枠にQRコードを写すと、その場所のピースが藍に染まります。
        </p>
        {total > 0 && (
          <p className="muted" style={{ marginTop: 8 }}>
            {done} / {total} 獲得
            {remaining > 0 ? ` ・ 残り ${remaining} スポット` : " ・ コンプリート"}
          </p>
        )}
      </div>

      {offline && (
        <div className="notice notice--err" role="status" aria-live="polite">
          オフラインです。通信できる場所でお試しください。
        </div>
      )}

      {msg && (
        <div
          className={`notice ${
            msg.type === "success" ? "notice--ok" : "notice--err"
          }`}
          role="status"
          aria-live="polite"
        >
          {msg.text}
          {retryable && (
            <button
              type="button"
              className="btn-secondary"
              onClick={retry}
              disabled={sending}
              style={{ marginTop: 10 }}
            >
              再試行
            </button>
          )}
        </div>
      )}

      {sending && (
        <p className="muted" role="status" aria-live="polite">
          送信中です…
        </p>
      )}

      <QRScanner
        onScan={handleScan}
        onError={(m) => setMsg({ type: "error", text: m })}
        disabled={sending}
      />

      <details className="dev panel panel--stitch">
        <summary>カメラが使えないとき</summary>
        <p style={{ fontSize: 12.5, margin: "4px 0 10px", lineHeight: 1.7 }}>
          QRコードの値を入力して獲得できます。
        </p>
        <label
          htmlFor="manual-qr"
          style={{ display: "block", fontSize: 12.5, marginBottom: 6 }}
        >
          QRコードの値
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            id="manual-qr"
            className="field"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitManual();
            }}
            placeholder="QRの値"
            inputMode="text"
            enterKeyHint="done"
            autoComplete="off"
            disabled={sending}
            style={{ flex: 1, fontSize: 13 }}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={submitManual}
            disabled={sending || !manualValue.trim()}
            style={{
              width: "auto",
              padding: "11px 16px",
              fontSize: 14,
              opacity: sending || !manualValue.trim() ? 0.6 : 1,
            }}
          >
            獲得
          </button>
        </div>
      </details>
    </div>
  );
}
