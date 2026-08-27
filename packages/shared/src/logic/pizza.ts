export interface PizzaSlice {
  index: number;
  checkpointId: string;
  startAngle: number;
  endAngle: number;
  path: string;
  labelAngle: number; // angle for icon/label placement
  isAcquired: boolean;
}

export interface PizzaConfig {
  cx: number;
  cy: number;
  radius: number;
  innerRadius: number; // for donut hole (0 = full pizza)
}

const DEFAULT_CONFIG: PizzaConfig = { cx: 100, cy: 100, radius: 90, innerRadius: 18 };

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeSlice(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number
): string {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const p1 = polarToCartesian(cx, cy, rOuter, startAngle);
  const p2 = polarToCartesian(cx, cy, rOuter, endAngle);

  if (rInner <= 0) {
    // Full slice (triangle + arc)
    return `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`;
  }
  const p3 = polarToCartesian(cx, cy, rInner, endAngle);
  const p4 = polarToCartesian(cx, cy, rInner, startAngle);
  return `M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x} ${p4.y} Z`;
}

export function getPizzaSlices(
  checkpoints: { id: string; order: number }[],
  acquiredIds: Set<string>,
  config: PizzaConfig = DEFAULT_CONFIG
): PizzaSlice[] {
  const sorted = [...checkpoints].sort((a, b) => a.order - b.order);
  const n = sorted.length;
  if (n === 0) return [];
  const anglePerSlice = 360 / n;

  return sorted.map((cp, i) => {
    const startAngle = i * anglePerSlice;
    const endAngle = (i + 1) * anglePerSlice;
    return {
      index: i,
      checkpointId: cp.id,
      startAngle,
      endAngle,
      path: describeSlice(config.cx, config.cy, config.radius, config.innerRadius, startAngle, endAngle),
      labelAngle: startAngle + anglePerSlice / 2,
      isAcquired: acquiredIds.has(cp.id),
    };
  });
}

export function getLabelPosition(angleDeg: number, cx = 100, cy = 100, r = 62) {
  return polarToCartesian(cx, cy, r, angleDeg);
}

// Warm palette for acquired slices
export const SLICE_COLORS = [
  "#f97316", // orange
  "#ef4444", // red
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#a855f7", // purple
  "#ec4899", // pink
  "#84cc16", // lime
];

export function getSliceColor(index: number): string {
  return SLICE_COLORS[index % SLICE_COLORS.length];
}
