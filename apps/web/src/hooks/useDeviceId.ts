import { useEffect, useState } from "react";

const KEY = "kojima_device_id";

export function useDeviceId(): string {
  const [id, setId] = useState(() => {
    if (typeof window === "undefined") return "";
    let v = localStorage.getItem(KEY);
    if (!v) { v = crypto.randomUUID(); localStorage.setItem(KEY, v); }
    return v;
  });
  useEffect(() => {
    // ensure user exists on server
    if (id) fetch(`/api/users/ensure/${id}`).catch(() => {});
  }, [id]);
  return id;
}
