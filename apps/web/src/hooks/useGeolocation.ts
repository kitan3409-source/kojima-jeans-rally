import { useCallback, useEffect, useRef, useState } from "react";
import type { LatLng } from "../logic/geo";

export type GeoStatus =
  | "idle"
  | "locating"
  | "granted"
  | "denied"
  | "unavailable"
  | "timeout";

export function useGeolocation() {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const request = useCallback(() => {
    if (inFlightRef.current) return;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      setError("この端末では位置情報を利用できません。");
      return;
    }

    inFlightRef.current = true;
    setStatus("locating");
    setError(null);

    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          inFlightRef.current = false;
          if (!mountedRef.current) return;
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setStatus("granted");
          setError(null);
        },
        (err) => {
          inFlightRef.current = false;
          if (!mountedRef.current) return;
          if (err.code === err.PERMISSION_DENIED) {
            setStatus("denied");
            setError(
              "位置情報の利用が許可されていません。ブラウザの設定から許可してください。"
            );
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            setStatus("unavailable");
            setError(
              "現在地を特定できませんでした。電波の良い場所でもう一度お試しください。"
            );
          } else if (err.code === err.TIMEOUT) {
            setStatus("timeout");
            setError(
              "位置情報の取得がタイムアウトしました。もう一度お試しください。"
            );
          } else {
            setStatus("unavailable");
            setError("現在地を取得できませんでした。");
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } catch {
      inFlightRef.current = false;
      if (!mountedRef.current) return;
      setStatus("unavailable");
      setError("現在地を取得できませんでした。");
    }
  }, []);

  return { position, status, error, request };
}
