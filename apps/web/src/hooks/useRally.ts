import { useEffect, useState } from "react";
import { useDeviceId } from "./useDeviceId";

export type Checkpoint = {
  id: string;
  name: string;
  description: string;
  order: number;
  qrCodeValue: string;
  lat: string | null;
  lng: string | null;
  imageUrl: string | null;
};

export type StampRecord = {
  id: string;
  userId: string;
  checkpointId: string;
  acquiredAt: string;
};

export function useRally() {
  const deviceId = useDeviceId();
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [stamps, setStamps] = useState<StampRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/api/checkpoints").then((r) => r.json()),
      deviceId
        ? fetch(`/api/stamps/${deviceId}`).then((r) => r.json())
        : Promise.resolve([]),
    ])
      .then(([cps, sts]) => {
        if (!alive) return;
        setCheckpoints(cps);
        setStamps(sts);
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [deviceId]);

  const acquiredIds = new Set<string>(stamps.map((s) => s.checkpointId));
  const total = checkpoints.length;
  const done = checkpoints.filter((c) => acquiredIds.has(c.id)).length;
  const isComplete = total > 0 && done === total;

  return {
    deviceId,
    checkpoints,
    stamps,
    setStamps,
    acquiredIds,
    total,
    done,
    isComplete,
    loading,
  };
}
