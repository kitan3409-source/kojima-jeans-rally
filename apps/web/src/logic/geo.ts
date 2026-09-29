export type LatLng = { lat: number; lng: number };

export type Bounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

const MIN_SPAN = 0.002;

function isFinitePoint(p: LatLng | null | undefined): p is LatLng {
  return (
    !!p &&
    typeof p.lat === "number" &&
    typeof p.lng === "number" &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng)
  );
}

export function toLatLng(cp: {
  lat: string | null;
  lng: string | null;
}): LatLng | null {
  if (cp.lat === null || cp.lng === null) return null;
  if (cp.lat.trim() === "" || cp.lng.trim() === "") return null;
  const lat = Number(cp.lat);
  const lng = Number(cp.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function distanceMeters(a: LatLng, b: LatLng): number {
  if (!isFinitePoint(a) || !isFinitePoint(b)) return NaN;
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

export function formatDistance(m: number): string {
  if (!Number.isFinite(m)) return "—";
  const meters = Math.max(0, m);
  if (meters < 1000) return `${Math.round(meters)}m`;
  if (meters < 10000) return `${(meters / 1000).toFixed(1)}km`;
  return `${Math.round(meters / 1000)}km`;
}

export function projectPoint(
  point: LatLng,
  bounds: Bounds,
  w: number,
  h: number
): { x: number; y: number } {
  const lat = Number.isFinite(point?.lat) ? point.lat : NaN;
  const lng = Number.isFinite(point?.lng) ? point.lng : NaN;
  const latRange = bounds.maxLat - bounds.minLat;
  const lngRange = bounds.maxLng - bounds.minLng;
  const x =
    !Number.isFinite(lngRange) ||
    lngRange === 0 ||
    !Number.isFinite(lng) ||
    !Number.isFinite(bounds.minLng)
      ? w / 2
      : ((lng - bounds.minLng) / lngRange) * w;
  const y =
    !Number.isFinite(latRange) ||
    latRange === 0 ||
    !Number.isFinite(lat) ||
    !Number.isFinite(bounds.minLat)
      ? h / 2
      : (1 - (lat - bounds.minLat) / latRange) * h;
  return { x, y };
}

export function boundsOf(points: LatLng[], padRatio = 0.15): Bounds {
  const valid = Array.isArray(points) ? points.filter(isFinitePoint) : [];
  const ratio =
    Number.isFinite(padRatio) && padRatio > 0 ? Math.min(padRatio, 1) : 0;

  if (valid.length === 0) {
    return {
      minLat: -MIN_SPAN / 2,
      maxLat: MIN_SPAN / 2,
      minLng: -MIN_SPAN / 2,
      maxLng: MIN_SPAN / 2,
    };
  }

  let minLat = valid[0].lat;
  let maxLat = valid[0].lat;
  let minLng = valid[0].lng;
  let maxLng = valid[0].lng;
  for (const p of valid) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }

  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;

  if (latSpan < MIN_SPAN) {
    const center = (minLat + maxLat) / 2;
    minLat = center - MIN_SPAN / 2;
    maxLat = center + MIN_SPAN / 2;
  } else {
    const latPad = latSpan * ratio;
    minLat -= latPad;
    maxLat += latPad;
  }

  if (lngSpan < MIN_SPAN) {
    const center = (minLng + maxLng) / 2;
    minLng = center - MIN_SPAN / 2;
    maxLng = center + MIN_SPAN / 2;
  } else {
    const lngPad = lngSpan * ratio;
    minLng -= lngPad;
    maxLng += lngPad;
  }

  return { minLat, maxLat, minLng, maxLng };
}
