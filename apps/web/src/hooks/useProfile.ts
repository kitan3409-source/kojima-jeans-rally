import { useCallback, useEffect, useRef, useState } from "react";
import { useDeviceId } from "./useDeviceId";

const CACHE_KEY = "kojima_nickname";

export function useProfile() {
  const deviceId = useDeviceId();
  const [nickname, setNickname] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(CACHE_KEY) ?? "";
  });
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!deviceId) {
      setReady(true);
      return;
    }
    let alive = true;
    setReady(false);
    fetch(`/api/profile/${deviceId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((data) => {
        if (!alive) return;
        if (typeof data?.nickname === "string" && data.nickname) {
          setNickname(data.nickname);
          localStorage.setItem(CACHE_KEY, data.nickname);
        }
      })
      .catch(() => {
        if (!alive) return;
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) setNickname(cached);
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [deviceId]);

  const save = useCallback(
    async (name: string): Promise<boolean> => {
      if (savingRef.current) return false;
      const trimmed = name.trim();
      setError(null);
      if (trimmed.length < 1 || trimmed.length > 24) {
        setError("ニックネームは1〜24文字で入力してください。");
        return false;
      }
      if (!deviceId) {
        setError("端末IDを取得できませんでした。");
        return false;
      }
      savingRef.current = true;
      setSaving(true);
      try {
        const res = await fetch(`/api/profile/${deviceId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nickname: trimmed }),
        });
        if (!res.ok) throw new Error("request failed");
        const data = await res.json();
        const next =
          typeof data?.nickname === "string" && data.nickname
            ? data.nickname
            : trimmed;
        setNickname(next);
        localStorage.setItem(CACHE_KEY, next);
        return true;
      } catch {
        localStorage.setItem(CACHE_KEY, trimmed);
        setNickname(trimmed);
        setError("保存できませんでした。端末に保存しました。");
        return false;
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [deviceId]
  );

  return { deviceId, nickname, ready, save, saving, error };
}
