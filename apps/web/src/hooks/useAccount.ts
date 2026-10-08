import { useCallback, useEffect, useRef, useState } from "react";
import { useDeviceId } from "./useDeviceId";

const DEVICE_ID_KEY = "kojima_device_id";

function setDeviceId(id: string) {
  localStorage.setItem(DEVICE_ID_KEY, id);
}

export type AccountStatus = {
  registered: boolean;
  loginId: string | null;
};

export function useAccount() {
  const deviceId = useDeviceId();
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!deviceId) return;
    let alive = true;
    fetch(`/api/auth/status/${deviceId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((data) => {
        if (!alive) return;
        setStatus({
          registered: Boolean(data?.registered),
          loginId: typeof data?.loginId === "string" ? data.loginId : null,
        });
      })
      .catch(() => {
        if (alive) setStatus({ registered: false, loginId: null });
      });
    return () => {
      alive = false;
    };
  }, [deviceId]);

  const register = useCallback(
    async (loginId: string, password: string): Promise<boolean> => {
      if (busyRef.current || !deviceId) return false;
      busyRef.current = true;
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: deviceId, loginId, password }),
        });
        const data = await res.json().catch(() => null);
        if (res.ok) {
          setStatus({
            registered: true,
            loginId: typeof data?.loginId === "string" ? data.loginId : loginId.trim().toLowerCase(),
          });
          return true;
        }
        if (res.status === 409 && typeof data?.error === "string" && data.error.includes("login ID")) {
          setError("そのIDはすでに使われています。別のIDにしてください。");
        } else if (res.status === 409) {
          setError("この端末にはすでにアカウントがあります。");
          setStatus((s) => (s ? { ...s, registered: true } : s));
        } else if (res.status === 400) {
          setError("IDは半角英数字・_・-で3〜24文字、パスワードは6〜72文字で入力してください。");
        } else if (res.status === 429) {
          setError("試行回数が多すぎます。しばらく待ってからお試しください。");
        } else {
          setError("登録できませんでした。もう一度お試しください。");
        }
        return false;
      } catch {
        setError("通信できませんでした。再試行してください。");
        return false;
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [deviceId]
  );

  return { deviceId, status, busy, error, setError, register };
}

const LOGIN_ID_PATTERN = /^[a-z0-9_-]{3,24}$/;

export function validateLoginId(value: string): string | null {
  const v = value.trim().toLowerCase();
  if (!LOGIN_ID_PATTERN.test(v)) {
    return "IDは半角英数字・_・-で3〜24文字にしてください。";
  }
  return null;
}

export async function login(loginId: string, password: string): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId, password }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && typeof data?.userId === "string") {
      setDeviceId(data.userId);
      return { ok: true };
    }
    if (res.status === 429) return { ok: false, message: "試行回数が多すぎます。しばらく待ってからお試しください。" };
    return { ok: false, message: "IDまたはパスワードが違います。" };
  } catch {
    return { ok: false, message: "通信できませんでした。再試行してください。" };
  }
}
