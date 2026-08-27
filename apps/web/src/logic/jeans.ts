export interface JeansSlice {
  index: number;
  checkpointId: string;
  y0: number;
  y1: number;
  isAcquired: boolean;
}

// Overalls silhouette (viewBox 0 0 200 260)
// Shoulder straps + bib + jeans body — proper overalls with chest area
export const JEANS_OUTLINE_D =
  "M 68 8 L 76 8 L 80 14 L 80 30 L 118 30 L 118 14 L 122 8 L 130 8 L 134 14 L 138 30 L 144 50 L 140 110 L 132 220 L 110 222 L 104 110 L 96 110 L 90 222 L 68 220 L 60 110 L 56 50 L 62 30 L 66 14 Z";

// Bib pocket
export const BIB_POCKET_D = "M 86 36 L 114 36 L 114 54 L 86 54 Z";

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
  const top = 8;
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
