export interface JeansSlice {
  index: number;
  checkpointId: string;
  y0: number;
  y1: number;
  isAcquired: boolean;
}

// Five-pocket jeans silhouette (viewBox 0 0 200 280).
// Waist, hips, thigh, crotch and two legs — unmistakably denim.
export const JEANS_OUTLINE_D =
  "M 38 22 Q 100 14 162 22 L 167 86 Q 161 130 154 160 L 141 276 L 108 276 Q 103 205 100 150 Q 97 205 92 276 L 59 276 L 46 160 Q 39 130 33 86 Z";

export const WAISTBAND_D = "M 38 22 Q 100 14 162 22 L 164 46 Q 100 52 36 46 Z";

// Left and right front pocket openings.
export const POCKET_LEFT_D = "M 41 54 Q 37 84 52 100 L 66 88 Q 55 74 56 56 Z";
export const POCKET_RIGHT_D = "M 159 54 Q 163 84 148 100 L 134 88 Q 145 74 144 56 Z";

// Undiscovered denim sits in the dark; collected slices ignite into indigo.
export const RAW_DENIM = "#27324d";
export const JEANS_COLORS = [
  "#3b62b0",
  "#3c66b7",
  "#406bbf",
  "#446fc7",
  "#4974cf",
  "#4f7ad8",
  "#5580e1",
  "#5c88ec",
];

export function getJeansSlices(
  checkpoints: { id: string; order: number }[],
  acquiredIds: Set<string>
): JeansSlice[] {
  const sorted = [...checkpoints].sort((a, b) => a.order - b.order);
  const n = sorted.length;
  if (n === 0) return [];
  const top = 46;
  const bottom = 276;
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
