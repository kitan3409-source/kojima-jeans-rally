import { useEffect, useRef, useState } from "react";
import type { Html5Qrcode as Html5QrcodeScanner } from "html5-qrcode";

function cameraErrorMessage(error: unknown): string {
  const name =
    error && typeof error === "object"
      ? (error as { name?: string }).name
      : undefined;
  if (name === "NotAllowedError" || name === "SecurityError")
    return "カメラの使用が許可されていません。ブラウザの設定をご確認ください。";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "利用できるカメラが見つかりません。";
  if (name === "NotReadableError" || name === "AbortError")
    return "カメラを起動できませんでした。他のアプリが使用中の可能性があります。";
  return "カメラを起動できませんでした。しばらくしてから再度お試しください。";
}

export default function QRScanner({
  onScan,
  onError,
  disabled,
}: {
  onScan: (value: string) => void;
  onError?: (msg: string) => void;
  disabled?: boolean;
}) {
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const busyRef = useRef(false);
  const handledRef = useRef(false);
  const mountedRef = useRef(true);

  const setBusySafe = (value: boolean) => {
    busyRef.current = value;
    if (mountedRef.current) setBusy(value);
  };

  const stop = async () => {
    if (busyRef.current) return;
    setBusySafe(true);
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        await scanner.stop();
      } catch {
        /* already stopped */
      }
      try {
        scanner.clear();
      } catch {
        /* already cleared */
      }
    }
    if (mountedRef.current) setActive(false);
    setBusySafe(false);
  };

  const start = async () => {
    if (busyRef.current || active || disabled) return;
    setBusySafe(true);
    handledRef.current = false;
    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      const previous = scannerRef.current;
      if (previous) {
        try {
          await previous.stop();
        } catch {
          /* already stopped */
        }
        try {
          previous.clear();
        } catch {
          /* already cleared */
        }
        scannerRef.current = null;
      }

      const element = document.getElementById("qr-reader");
      if (element && element.childElementCount > 0) element.innerHTML = "";

      let scanner: Html5QrcodeScanner;
      try {
        scanner = new Html5Qrcode("qr-reader");
      } catch {
        const el = document.getElementById("qr-reader");
        if (el) el.innerHTML = "";
        scanner = new Html5Qrcode("qr-reader");
      }
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => {
          if (handledRef.current) return;
          handledRef.current = true;
          onScan(decoded);
          void stop();
        },
        () => {}
      );
      if (mountedRef.current && !handledRef.current) setActive(true);
    } catch (error: unknown) {
      scannerRef.current = null;
      onError?.(cameraErrorMessage(error));
    } finally {
      setBusySafe(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        try {
          scanner
            .stop()
            .catch(() => {})
            .finally(() => {
              try {
                scanner.clear();
              } catch {
                /* already cleared */
              }
            });
        } catch {
          /* already stopped */
        }
      }
    };
  }, []);

  return (
    <div>
      <div className="viewfinder">
        <span className="corner tl" />
        <span className="corner tr" />
        <span className="corner bl" />
        <span className="corner br" />
        <div id="qr-reader" style={{ width: "100%" }} />
      </div>

      {!active ? (
        <button
          type="button"
          className="shutter"
          onClick={start}
          disabled={busy || disabled}
          aria-busy={busy}
          style={busy || disabled ? { opacity: 0.6 } : undefined}
        >
          {busy ? "起動中" : "起動"}
        </button>
      ) : (
        <button
          type="button"
          className="btn-secondary"
          onClick={stop}
          disabled={busy}
          aria-busy={busy}
          style={{ marginTop: 18, opacity: busy ? 0.6 : 1 }}
        >
          {busy ? "停止中" : "停止"}
        </button>
      )}
      <p className="muted" style={{ textAlign: "center", marginTop: 12 }}>
        枠内にQRコードを収めてください
      </p>
    </div>
  );
}
