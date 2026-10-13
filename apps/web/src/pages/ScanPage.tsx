import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import QRScanner from "../components/QRScanner";
import JeansStamp from "../components/JeansStamp";
import { useRally } from "../hooks/useRally";
import { getCurrentFix } from "../logic/geo";

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function AcquisitionView({
  checkpoints,
  acquiredIds,
  checkpointId,
  message,
  onDone,
}: {
  checkpoints: { id: string; order: number; name: string }[];
  acquiredIds: Set<string>;
  checkpointId: string;
  message: string;
  onDone: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const found = checkpoints.some((c) => c.id === checkpointId);
  const [phase, setPhase] = useState<"piece" | "whole">("piece");
  const doneRef = useRef(false);
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  useEffect(() => {
    if (reduceMotion || !found) setPhase("whole");
  }, [reduceMotion, found]);

  useEffect(() => {
    if (phase !== "whole") return;
    const t = window.setTimeout(finish, reduceMotion ? 900 : 1600);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reduceMotion]);

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
      {phase === "piece" ? (
        <JeansStamp
          checkpoints={checkpoints}
          acquiredIds={acquiredIds}
          soloId={checkpointId}
          animatingId={checkpointId}
          onAnimationComplete={() => setPhase("whole")}
        />
      ) : (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <JeansStamp checkpoints={checkpoints} acquiredIds={acquiredIds} />
        </motion.div>
      )}
      <p className="lead" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}

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
  const [statusText, setStatusText] = useState<string | null>(null);
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
      setStatusText("位置情報を確認しています…");
      let fix: { lat: number; lng: number; accuracy: number };
      try {
        fix = await getCurrentFix();
      } catch (geoErr: any) {
        const code = geoErr?.code;
        setRetryable(true);
        if (code === 1)
          setMsg({
            type: "error",
            text: "スタンプを獲得するには位置情報の許可が必要です。ブラウザ（端末）の設定で位置情報を許可してから、QRを読み直してください。",
          });
        else if (code === 3)
          setMsg({
            type: "error",
            text: "位置情報の取得がタイムアウトしました。電波の良い場所でQRを読み直してください。",
          });
        else
          setMsg({
            type: "error",
            text: "現在地を取得できませんでした。位置情報を有効にして、もう一度お試しください。",
          });
        return;
      }
      setStatusText("送信中です…");
      const res = await fetch("/api/stamps/acquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: deviceId,
          qrCodeValue: value,
          lat: fix.lat,
          lng: fix.lng,
          accuracy: fix.accuracy,
        }),
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
        else if (res.status === 403) {
          const d = data?.distance;
          const dist =
            typeof d === "number" && d >= 0
              ? d >= 1000
                ? `${(d / 1000).toFixed(1)}km`
                : `${d}m`
              : null;
          setMsg({
            type: "error",
            text: dist
              ? `スポットから離れているため記録できません（約${dist}）。現地のQRコードを読み取ってください。`
              : "スポットから離れているため記録できません。現地のQRコードを読み取ってください。",
          });
        } else if (res.status === 400)
          setMsg(
            data?.error === "location_required"
              ? {
                  type: "error",
                  text: "位置情報を取得できませんでした。位置情報を許可してから、もう一度お試しください。",
                }
              : { type: "error", text: "入力内容を確認してください。" }
          );
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
      setStatusText(null);
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
      <AcquisitionView
        checkpoints={checkpoints}
        acquiredIds={new Set([...acquiredIds, animatingId])}
        checkpointId={animatingId}
        message={msg?.text ?? ""}
        onDone={handleAnimComplete}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h1 className="display">QRコードを読み取る</h1>
        <p className="lead" style={{ marginTop: 6 }}>
          枠にQRコードを写すと、その場所のピースが藍に染まります。
        </p>
        <p className="muted" style={{ marginTop: 4, fontSize: 12.5 }}>
          スタンプの記録には現在地の確認が必要です。位置情報の利用を許可してください。
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

      {statusText && (
        <p className="muted" role="status" aria-live="polite">
          {statusText}
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
