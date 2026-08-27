import { getPizzaSlices, getSliceColor, getLabelPosition } from "../logic/pizza";
import { motion } from "framer-motion";

const TOPPING_EMOJI = ["🧀", "🍅", "🌿", "🍄", "🫒", "🌶️", "🧅", "🥓"];

export default function PizzaStamp({
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
  const slices = getPizzaSlices(checkpoints, acquiredIds);

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <svg viewBox="0 0 200 200" width="280" height="280" style={{ overflow: "visible" }}>
        {/* plate shadow */}
        <ellipse cx={100} cy={100} rx={92} ry={92} fill="#fef3c7" />
        {slices.map((s: any) => {
          const isAnimating = s.checkpointId === animatingId;
          const color = getSliceColor(s.index);
          const labelPos = getLabelPosition(s.labelAngle, 100, 100, 55);
          return (
            <g key={s.checkpointId}>
              <motion.path
                d={s.path}
                fill={s.isAcquired ? color : "#e5e7eb"}
                stroke="#fff"
                strokeWidth={2}
                initial={false}
                animate={
                  isAnimating
                    ? { filter: ["drop-shadow(0 0 0px #f97316)", "drop-shadow(0 0 16px #f97316)", "drop-shadow(0 0 0px transparent)"] }
                    : {}
                }
                transition={isAnimating ? ({ duration: 1.2 } as any) : {}}
                onAnimationComplete={isAnimating ? onAnimationComplete : undefined}
                style={{
                  opacity: s.isAcquired ? 1 : 0.5,
                }}
              />
              {/* topping emoji */}
              {s.isAcquired && (
                <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle" fontSize={18}>
                  {TOPPING_EMOJI[s.index % TOPPING_EMOJI.length]}
                </text>
              )}
              {!s.isAcquired && (
                <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle" fontSize={14} opacity={0.3}>
                  ?
                </text>
              )}
            </g>
          );
        })}
        {/* center dot */}
        <circle cx={100} cy={100} r={10} fill="#fff" stroke="#f97316" strokeWidth={2} />
        <text x={100} y={103} textAnchor="middle" fontSize={8} fontWeight={700} fill="#f97316">
          {acquiredIds.size}/{checkpoints.length}
        </text>
      </svg>
    </div>
  );
}
