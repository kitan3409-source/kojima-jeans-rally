import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function QRScanner({ onScan, onError }: { onScan: (value: string) => void; onError?: (msg: string) => void }) {
  const [active, setActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const start = async () => {
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => { onScan(decoded); stop(); },
        () => {}
      );
      setActive(true);
    } catch (e: any) {
      onError?.(e.message ?? "カメラの起動に失敗しました。ブラウザのカメラ許可を確認してください。");
    }
  };

  const stop = async () => {
    try { await scannerRef.current?.stop(); scannerRef.current?.clear(); } catch {}
    setActive(false);
  };

  useEffect(() => { return () => { scannerRef.current?.stop().catch(() => {}); }; }, []);

  return (
    <div>
      <div id="qr-reader" style={{ width: "100%", borderRadius: 12, overflow: "hidden" }} />
      {!active ? (
        <button className="btn-primary" onClick={start} style={{ marginTop: 12 }}>📷 カメラを起動</button>
      ) : (
        <button className="btn-secondary" onClick={stop} style={{ marginTop: 12, width: "100%" }}>停止</button>
      )}
      <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8, textAlign: "center" }}>QRコードを枠内に収めてください</p>
    </div>
  );
}
