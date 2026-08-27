export interface JeansSlice {
  index: number;
  checkpointId: string;
  y0: number;
  y1: number;
  isAcquired: boolean;
}

export const JEANS_OUTLINE_D =
  "M 70 10 L 78 10 L 82 28 L 118 28 L 122 10 L 130 10 L 136 28 L 142 50 L 138 110 L 130 220 L 108 222 L 102 110 L 98 110 L 92 222 L 70 220 L 62 110 L 58 50 L 64 28 Z";

export const BIB_POCKET_D = "M 85 36 L 115 36 L 115 54 L 85 54 Z";

export const JEANS_COLORS = [
  "#1e3a5f",
  "#1e40af",
  "#2563eb",
  "#3b82f6",
  "#60a5fa",
  "#93c5fd",
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
  const top = 10;
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
