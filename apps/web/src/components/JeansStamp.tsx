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
          {/* denim texture pattern */}
          <pattern id="denim-texture" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill="none" />
            <circle cx="1" cy="1" r="0.4" fill="rgba(255,255,255,0.15)" />
            <circle cx="3" cy="3" r="0.4" fill="rgba(255,255,255,0.15)" />
          </pattern>
        </defs>

        {/* base jeans (unacquired = light washed denim) */}
        <path d={JEANS_OUTLINE_D} fill="#d6dbe6" stroke="#9ca3af" strokeWidth={1.5} />

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
                {/* denim texture overlay on acquired */}
                {s.isAcquired && (
                  <rect x={0} y={s.y0} width={200} height={h} fill="url(#denim-texture)" opacity={0.5} />
                )}
                {/* horizontal stitch line */}
                <line x1={55} y1={s.y1} x2={145} y2={s.y1} stroke={s.isAcquired ? "#c9a84c" : "#b0b8c8"} strokeWidth={0.8} opacity={s.isAcquired ? 0.7 : 0.4} strokeDasharray="5 3" />
                {/* vertical seam (center) */}
                {s.isAcquired && (
                  <line x1={100} y1={s.y0} x2={100} y2={s.y1} stroke="#c9a84c" strokeWidth={0.6} opacity={0.4} strokeDasharray="4 3" />
                )}
                {/* emoji / number */}
                {s.isAcquired ? (
                  <text x={100} y={cy + 6} textAnchor="middle" fontSize={15} style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }}>
                    {PATCH_EMOJI[s.index % PATCH_EMOJI.length]}
                  </text>
                ) : (
                  <text x={100} y={cy + 5} textAnchor="middle" fontSize={12} fill="#8a94a8" fontWeight={700}>
                    {s.index + 1}
                  </text>
                )}
                {/* glow on animating */}
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
        <path d={JEANS_OUTLINE_D} fill="none" stroke="#1e3a5f" strokeWidth={1.6} />

        {/* waistband stitch */}
        <line x1={58} y1={28} x2={142} y2={28} stroke="#c9a84c" strokeWidth={0.7} strokeDasharray="4 2" opacity={0.6} />

        {/* belt loops */}
        <rect x={72} y={18} width={4} height={12} rx={1} fill="#1e3a5f" stroke="#c9a84c" strokeWidth={0.5} />
        <rect x={124} y={18} width={4} height={12} rx={1} fill="#1e3a5f" stroke="#c9a84c" strokeWidth={0.5} />

        {/* waist button */}
        <circle cx={100} cy={23} r={4.5} fill="#d4a843" stroke="#92400e" strokeWidth={1} />
        <circle cx={100} cy={23} r={1.5} fill="#92400e" opacity={0.5} />

        {/* pockets (subtle) */}
        <path d="M 62 38 L 78 38 L 78 58 L 62 52 Z" fill="none" stroke="#1e3a5f" strokeWidth={0.6} opacity={0.35} />
        <path d="M 122 38 L 138 38 L 138 52 L 122 58 Z" fill="none" stroke="#1e3a5f" strokeWidth={0.6} opacity={0.35} />
        {/* pocket stitch */}
        <path d="M 64 40 L 76 40 L 76 54" fill="none" stroke="#c9a84c" strokeWidth={0.5} strokeDasharray="3 2" opacity={0.4} />
        <path d="M 124 40 L 136 40 L 136 50" fill="none" stroke="#c9a84c" strokeWidth={0.5} strokeDasharray="3 2" opacity={0.4} />

        {/* progress */}
        <text x={100} y={244} textAnchor="middle" fontSize={12} fontWeight={700} fill="#1e3a5f">
          {acquiredIds.size} / {checkpoints.length}
        </text>
      </svg>
    </div>
  );
}
