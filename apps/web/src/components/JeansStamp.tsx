import { getJeansSlices, getJeansColor, JEANS_OUTLINE_D, BIB_POCKET_D } from "../logic/jeans";
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
          <pattern id="denim-texture" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.4" fill="rgba(255,255,255,0.15)" />
            <circle cx="3" cy="3" r="0.4" fill="rgba(255,255,255,0.15)" />
          </pattern>
        </defs>

        {/* base (unacquired = light wash) */}
        <path d={JEANS_OUTLINE_D} fill="#d6dbe6" stroke="#9ca3af" strokeWidth={1.5} />

        {/* slices */}
        <g clipPath="url(#jeans-clip)">
          {slices.map((s) => {
            const isAnimating = s.checkpointId === animatingId;
            const color = getJeansColor(s.index);
            const h = s.y1 - s.y0;
            const cy = (s.y0 + s.y1) / 2;
            return (
              <g key={s.checkpointId}>
                <motion.rect
                  x={0} y={s.y0} width={200} height={h + 0.5}
                  fill={s.isAcquired ? color : "transparent"}
                  initial={false}
                  animate={isAnimating ? { filter: ["brightness(1)", "brightness(1.6)", "brightness(1)"] } as any : {}}
                  transition={isAnimating ? ({ duration: 1.2 } as any) : {}}
                  onAnimationComplete={isAnimating ? onAnimationComplete : undefined}
                />
                {s.isAcquired && <rect x={0} y={s.y0} width={200} height={h} fill="url(#denim-texture)" opacity={0.5} />}
                <line x1={55} y1={s.y1} x2={145} y2={s.y1} stroke={s.isAcquired ? "#c9a84c" : "#b0b8c8"} strokeWidth={0.8} opacity={s.isAcquired ? 0.7 : 0.4} strokeDasharray="5 3" />
                {s.isAcquired && <line x1={100} y1={s.y0} x2={100} y2={s.y1} stroke="#c9a84c" strokeWidth={0.6} opacity={0.4} strokeDasharray="4 3" />}
                {s.isAcquired ? (
                  <text x={100} y={cy + 6} textAnchor="middle" fontSize={15} style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }}>
                    {PATCH_EMOJI[s.index % PATCH_EMOJI.length]}
                  </text>
                ) : (
                  <text x={100} y={cy + 5} textAnchor="middle" fontSize={12} fill="#8a94a8" fontWeight={700}>{s.index + 1}</text>
                )}
                {isAnimating && (
                  <motion.rect x={0} y={s.y0} width={200} height={h} fill="none" stroke="#60a5fa" strokeWidth={3}
                    initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.2 }} />
                )}
              </g>
            );
          })}
        </g>

        {/* outline */}
        <path d={JEANS_OUTLINE_D} fill="none" stroke="#1e3a5f" strokeWidth={1.6} />

        {/* bib stitch */}
        <line x1={82} y1={28} x2={118} y2={28} stroke="#c9a84c" strokeWidth={0.7} strokeDasharray="4 2" opacity={0.6} />

        {/* strap buttons */}
        <circle cx={74} cy={14} r={3.5} fill="#d4a843" stroke="#92400e" strokeWidth={0.8} />
        <circle cx={126} cy={14} r={3.5} fill="#d4a843" stroke="#92400e" strokeWidth={0.8} />

        {/* strap adjustment buckles */}
        <rect x={70} y={18} width={8} height={5} rx={1} fill="none" stroke="#c9a84c" strokeWidth={0.6} opacity={0.5} />
        <rect x={122} y={18} width={8} height={5} rx={1} fill="none" stroke="#c9a84c" strokeWidth={0.6} opacity={0.5} />

        {/* bib pocket */}
        <path d={BIB_POCKET_D} fill="none" stroke="#1e3a5f" strokeWidth={0.6} opacity={0.35} />
        <path d="M 87 38 L 113 38 L 113 50" fill="none" stroke="#c9a84c" strokeWidth={0.5} strokeDasharray="3 2" opacity={0.4} />

        {/* side pockets */}
        <path d="M 62 50 L 76 50 L 76 66 L 62 62 Z" fill="none" stroke="#1e3a5f" strokeWidth={0.6} opacity={0.3} />
        <path d="M 124 50 L 138 50 L 138 62 L 124 66 Z" fill="none" stroke="#1e3a5f" strokeWidth={0.6} opacity={0.3} />

        {/* waist button (on bib bottom area) */}
        <circle cx={100} cy={32} r={3} fill="#d4a843" stroke="#92400e" strokeWidth={0.8} />

        {/* progress */}
        <text x={100} y={244} textAnchor="middle" fontSize={12} fontWeight={700} fill="#1e3a5f">
          {acquiredIds.size} / {checkpoints.length}
        </text>
      </svg>
    </div>
  );
}
