import { getJeansSlices, getJeansColor, JEANS_OUTLINE_D } from "../logic/jeans";
import { motion } from "framer-motion";

const PATCH_EMOJI = ["🧵", "✂️", "👖", "⭐", "🌊", "🏖️", "🗻", "⚓"];

export default function JeansStamp({
  checkpoints,
  acquiredIds,
  animatingId,
  onAnimationComplete,
}: {
  checkpoints: { id: string; order: number; name: string }[];
  acquiredIds: Set<string>;
  animatingId?: string | null;
  onAnimationComplete?: () => void;
}) {
  const slices = getJeansSlices(checkpoints, acquiredIds);

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <svg viewBox="0 0 200 250" width="220" height="275" style={{ overflow: "visible" }}>
        <defs>
          <clipPath id="jeans-clip">
            <path d={JEANS_OUTLINE_D} />
          </clipPath>
        </defs>

        {/* base jeans outline (light gray for unacquired area) */}
        <path d={JEANS_OUTLINE_D} fill="#e5e7eb" stroke="#9ca3af" strokeWidth={1.5} />

        {/* slices clipped to jeans shape */}
        <g clipPath="url(#jeans-clip)">
          {slices.map((s) => {
            const isAnimating = s.checkpointId === animatingId;
            const color = getJeansColor(s.index);
            const h = s.y1 - s.y0;
            const cy = (s.y0 + s.y1) / 2;
            return (
              <g key={s.checkpointId}>
                <motion.rect
                  x={0}
                  y={s.y0}
                  width={200}
                  height={h + 0.5}
                  fill={s.isAcquired ? color : "transparent"}
                  initial={false}
                  animate={isAnimating ? { filter: ["brightness(1)", "brightness(1.6)", "brightness(1)"] } as any : {}}
                  transition={isAnimating ? ({ duration: 1.2 } as any) : {}}
                  onAnimationComplete={isAnimating ? onAnimationComplete : undefined}
                />
                {/* stitch line */}
                <line x1={55} y1={s.y1} x2={145} y2={s.y1} stroke="#fff" strokeWidth={s.isAcquired ? 0.7 : 0} opacity={0.5} strokeDasharray="4 3" />
                {/* emoji / number */}
                {s.isAcquired ? (
                  <text x={100} y={cy + 6} textAnchor="middle" fontSize={16}>
                    {PATCH_EMOJI[s.index % PATCH_EMOJI.length]}
                  </text>
                ) : (
                  <text x={100} y={cy + 5} textAnchor="middle" fontSize={12} fill="#9ca3af" fontWeight={700}>
                    {s.index + 1}
                  </text>
                )}
                {/* glow overlay for animating */}
                {isAnimating && (
                  <motion.rect
                    x={0} y={s.y0} width={200} height={h}
                    fill="none" stroke="#60a5fa" strokeWidth={3}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.2 }}
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* outline on top */}
        <path d={JEANS_OUTLINE_D} fill="none" stroke="#374151" strokeWidth={1.5} />

        {/* waist button */}
        <circle cx={100} cy={22} r={4} fill="#d4a843" stroke="#92400e" strokeWidth={1} />

        {/* progress text */}
        <text x={100} y={244} textAnchor="middle" fontSize={11} fontWeight={700} fill="#1e3a5f">
          {acquiredIds.size} / {checkpoints.length}
        </text>
      </svg>
    </div>
  );
}
