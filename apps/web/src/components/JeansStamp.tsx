import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  getJeansSlices,
  getJeansColor,
  JEANS_OUTLINE_D,
  WAISTBAND_D,
  POCKET_LEFT_D,
  POCKET_RIGHT_D,
  RAW_DENIM,
} from "../logic/jeans";

const VOID = "#05080f";
const WAIST = "#1c2a4a";
const DIM = "#56678a";
const DIM2 = "#7f9bc9";
const THREAD = "#e08a35";
const COPPER = "#c08a52";
const FOG = "#e9eef8";
const ECRU = "#e6e0cf";

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
  const total = checkpoints.length;
  const done = checkpoints.filter((c) => acquiredIds.has(c.id)).length;
  const remaining = Math.max(0, total - done);

  const [reduceMotion, setReduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduceMotion(query.matches);
    onChange();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const firedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!animatingId) {
      firedRef.current = null;
      return;
    }
    if (!reduceMotion) return;
    if (firedRef.current === animatingId) return;
    firedRef.current = animatingId;
    onAnimationComplete?.();
  }, [reduceMotion, animatingId, onAnimationComplete]);

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <svg
        viewBox="0 0 200 280"
        width={210}
        height={294}
        role="img"
        aria-label={`ジーンズの染色状況。${total} ピース中 ${done} ピース獲得、残り ${remaining} ピース。`}
        style={{
          maxWidth: "100%",
          height: "auto",
          overflow: "visible",
          filter: done
            ? "drop-shadow(0 26px 60px rgba(70,120,220,0.4))"
            : "drop-shadow(0 20px 40px rgba(0,0,0,0.7))",
          transition: "filter 0.6s ease",
        }}
      >
        <defs>
          <clipPath id="jeans-clip">
            <path d={JEANS_OUTLINE_D} />
          </clipPath>
          <pattern id="weave" width="3" height="3" patternUnits="userSpaceOnUse">
            <path
              d="M0 0 L3 3"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.6"
            />
            <path d="M3 0 L0 3" stroke="rgba(0,0,0,0.28)" strokeWidth="0.6" />
          </pattern>
          <pattern id="slub" width="7" height="7" patternUnits="userSpaceOnUse">
            <line
              x1="0"
              y1="2"
              x2="5"
              y2="2"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="0.6"
            />
            <line
              x1="2"
              y1="6"
              x2="7"
              y2="6"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="0.6"
            />
          </pattern>
          {/* dyed sheen across the garment */}
          <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="0.45" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.28" />
          </linearGradient>
        </defs>

        {/* undiscovered body */}
        <path
          d={JEANS_OUTLINE_D}
          fill={RAW_DENIM}
          stroke={VOID}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        <g clipPath="url(#jeans-clip)">
          <rect x="0" y="0" width="200" height="280" fill="url(#weave)" />

          {slices.map((s) => {
            const isAnimating = s.checkpointId === animatingId;
            const animate = isAnimating && !reduceMotion;
            const h = s.y1 - s.y0;
            const cy = (s.y0 + s.y1) / 2;
            return (
              <g key={s.checkpointId}>
                {s.isAcquired && (
                  <motion.rect
                    x={0}
                    y={s.y0}
                    width={200}
                    height={h + 0.6}
                    fill={getJeansColor(s.index)}
                    initial={animate ? { opacity: 0, scaleY: 0.2 } : false}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={
                      animate
                        ? { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
                        : { duration: 0 }
                    }
                    style={{
                      transformBox: "fill-box",
                      transformOrigin: "50% 100%",
                    }}
                    onAnimationComplete={
                      animate ? onAnimationComplete : undefined
                    }
                  />
                )}
                {s.isAcquired && (
                  <rect
                    x="0"
                    y={s.y0}
                    width="200"
                    height={h}
                    fill="url(#weave)"
                    opacity="0.6"
                  />
                )}

                <line
                  x1={30}
                  y1={s.y1}
                  x2={170}
                  y2={s.y1}
                  stroke={s.isAcquired ? THREAD : "#33425f"}
                  strokeWidth={0.7}
                  opacity={s.isAcquired ? 0.7 : 0.6}
                  strokeDasharray="4 3"
                />

                <circle
                  cx={100}
                  cy={cy}
                  r={9}
                  fill={s.isAcquired ? "rgba(5,8,15,0.35)" : "none"}
                  stroke={s.isAcquired ? FOG : DIM}
                  strokeWidth={s.isAcquired ? 1 : 1.1}
                  strokeDasharray={s.isAcquired ? "0" : "2 2"}
                  opacity={0.9}
                />
                <text
                  x={100}
                  y={cy + 4}
                  textAnchor="middle"
                  fontFamily='"Oswald", "Zen Kaku Gothic New", sans-serif'
                  fontWeight={500}
                  fontSize={12}
                  fill={s.isAcquired ? FOG : DIM2}
                >
                  {s.index + 1}
                </text>
              </g>
            );
          })}

          <rect x="0" y="0" width="200" height="280" fill="url(#sheen)" />
          <rect x="0" y="0" width="200" height="280" fill="url(#slub)" />
        </g>

        {/* seams & hardware */}
        <path
          d="M 167 86 Q 161 130 154 160 L 141 274"
          fill="none"
          stroke={THREAD}
          strokeWidth={0.7}
          strokeDasharray="3 3"
          opacity={0.5}
        />
        <path
          d="M 33 86 Q 39 130 46 160 L 59 274"
          fill="none"
          stroke={THREAD}
          strokeWidth={0.7}
          strokeDasharray="3 3"
          opacity={0.5}
        />
        <path
          d="M 100 150 Q 97 205 92 274"
          fill="none"
          stroke={THREAD}
          strokeWidth={0.7}
          strokeDasharray="3 3"
          opacity={0.5}
        />
        <path
          d="M 100 150 Q 103 205 108 274"
          fill="none"
          stroke={THREAD}
          strokeWidth={0.7}
          strokeDasharray="3 3"
          opacity={0.5}
        />

        <line x1={61} y1={266} x2={90} y2={266} stroke={THREAD} strokeWidth={0.7} strokeDasharray="3 2" opacity={0.6} />
        <line x1={110} y1={266} x2={139} y2={266} stroke={THREAD} strokeWidth={0.7} strokeDasharray="3 2" opacity={0.6} />

        <path
          d="M 100 46 Q 96 72 100 104"
          fill="none"
          stroke={THREAD}
          strokeWidth={0.8}
          strokeDasharray="3 2"
          opacity={0.7}
        />
        <line x1={98} y1={48} x2={98} y2={104} stroke={THREAD} strokeWidth={0.5} strokeDasharray="3 2" opacity={0.45} />

        <path d={POCKET_LEFT_D} fill="none" stroke={THREAD} strokeWidth={0.9} strokeDasharray="3 2" opacity={0.75} />
        <path d={POCKET_RIGHT_D} fill="none" stroke={THREAD} strokeWidth={0.9} strokeDasharray="3 2" opacity={0.75} />

        <circle cx={43} cy={62} r={1.9} fill={COPPER} stroke="#4d3418" strokeWidth={0.5} />
        <circle cx={157} cy={62} r={1.9} fill={COPPER} stroke="#4d3418" strokeWidth={0.5} />
        <circle cx={100} cy={106} r={2.2} fill={COPPER} stroke="#4d3418" strokeWidth={0.5} />

        {/* waistband */}
        <path d={WAISTBAND_D} fill={WAIST} stroke={VOID} strokeWidth={1.2} />
        <path d="M 39 27 Q 100 19 161 27" fill="none" stroke={THREAD} strokeWidth={0.7} strokeDasharray="3 2" opacity={0.7} />
        <path d="M 37 42 Q 100 48 163 42" fill="none" stroke={THREAD} strokeWidth={0.7} strokeDasharray="3 2" opacity={0.7} />

        {[50, 96.5, 143].map((x) => (
          <rect key={x} x={x} y={17} width={7} height={30} rx={1} fill={WAIST} stroke={THREAD} strokeWidth={0.5} opacity={0.9} />
        ))}

        {/* woven brand label with selvedge edge */}
        <g transform="rotate(-4 150 40)">
          <rect x={138} y={34} width={24} height={11} fill={ECRU} stroke={VOID} strokeWidth={0.4} />
          <rect x={160} y={34} width={2} height={11} fill={THREAD} opacity={0.9} />
          <text
            x={149}
            y={42}
            textAnchor="middle"
            fontFamily='"Zen Old Mincho", serif'
            fontWeight={700}
            fontSize={6.5}
            fill="#0a1020"
            letterSpacing="0.5"
          >
            児島
          </text>
        </g>

        <path
          d={JEANS_OUTLINE_D}
          fill="none"
          stroke={VOID}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
