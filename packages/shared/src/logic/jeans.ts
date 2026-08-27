export interface JeansSlice {
  index: number;
  checkpointId: string;
  y0: number; // top of slice (in SVG coords)
  y1: number; // bottom of slice
  isAcquired: boolean;
}

// Jeans silhouette path (viewBox 0 0 200 260)
// A simple jeans shape: waist straight, legs tapering slightly
export const JEANS_OUTLINE_D =
  "M 58 18 L 142 18 L 145 26 L 142 50 L 138 110 L 130 220 L 108 222 L 102 110 L 98 110 L 92 222 L 70 220 L 62 110 L 58 50 L 55 26 Z";

// Denim color palette (indigo shades)
export const JEANS_COLORS = [
  "#1e3a5f", // deep indigo
  "#1e40af", // indigo
  "#2563eb", // blue
  "#3b82f6", // light indigo
  "#60a5fa", // faded denim
  "#93c5fd", // light wash
  "#1e3a5f",
  "#1e40af",
];

export function getJeansSlices(
  checkpoints: { id: string; order: number }[],
  acquiredIds: Set<string>
): JeansSlice[] {
  const sorted = [...checkpoints].sort((a, b) => a.order - b.order);
  const n = sorted.length;
  if (n === 0) return [];
  // Jeans vertical range: y 18 to 222
  const top = 18;
  const bottom = 222;
  const h = (bottom - top) / n;
  return sorted.map((cp, i) => ({
    index: i,
    checkpointId: cp.id,
    y0: top + h * i,
    y1: top + h * (i + 1),
    isAcquired: acquiredIds.has(cp.id),
  }));
}

export function getJeansColor(index: number): string {
  return JEANS_COLORS[index % JEANS_COLORS.length];
}
