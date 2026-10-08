import { useState, type CSSProperties } from "react";
import { boundsOf, projectPoint, toLatLng, type LatLng } from "../logic/geo";

const VIEW_W = 320;

type CheckpointLike = {
  id: string;
  name: string;
  order: number;
  lat: string | null;
  lng: string | null;
};

type Spot = {
  id: string;
  name: string;
  order: number;
  pos: LatLng;
};

function LegendSwatch({
  kind,
  label,
}: {
  kind: "acquired" | "pending" | "here";
  label: string;
}) {
  const swatch: CSSProperties =
    kind === "acquired"
      ? {
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "var(--indigo)",
          border: "1px solid var(--thread)",
          display: "inline-block",
        }
      : kind === "pending"
      ? {
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "transparent",
          border: "1px dashed var(--line)",
          display: "inline-block",
        }
      : {
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "var(--selvedge)",
          border: "1px solid var(--fog)",
          boxShadow: "0 0 0 2px rgba(200,69,47,0.2)",
          display: "inline-block",
        };
  return (
    <span className="chip" style={{ gap: 6, padding: "3px 9px" }}>
      <span aria-hidden="true" style={swatch} />
      {label}
    </span>
  );
}

export default function SpotMap({
  checkpoints,
  acquiredIds,
  userPosition,
  height = 180,
  onSelect,
  highlightId,
}: {
  checkpoints: CheckpointLike[];
  acquiredIds: Set<string>;
  userPosition?: LatLng | null;
  height?: number;
  onSelect?: (id: string) => void;
  highlightId?: string;
}) {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const spots: Spot[] = [];
  for (const cp of checkpoints) {
    const pos = toLatLng(cp);
    if (pos) spots.push({ id: cp.id, name: cp.name, order: cp.order, pos });
  }

  if (spots.length === 0) {
    return (
      <div
        className="map-wrap muted"
        role="img"
        aria-label="位置情報のあるスポットがありません"
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        位置情報のあるスポットがありません
      </div>
    );
  }

  const allPoints = userPosition
    ? [...spots.map((s) => s.pos), userPosition]
    : spots.map((s) => s.pos);
  const bounds = boundsOf(allPoints, 0.12);

  const route = [...spots]
    .sort((a, b) => a.order - b.order)
    .map((s) => projectPoint(s.pos, bounds, VIEW_W, height));
  const routePoints = route.map((p) => `${p.x},${p.y}`).join(" ");

  const gridX: number[] = [];
  for (let x = 40; x < VIEW_W; x += 40) gridX.push(x);
  const gridY: number[] = [];
  for (let y = 40; y < height; y += 40) gridY.push(y);

  const userPoint = userPosition
    ? projectPoint(userPosition, bounds, VIEW_W, height)
    : null;

  const mapLabel = `スポットの模式図。全${spots.length}件のスポット${
    userPoint ? "と現在地" : ""
  }を表示。`;

  return (
    <div className="map-wrap">
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={mapLabel}
        style={{ display: "block" }}
      >
        <rect
          x={0}
          y={0}
          width={VIEW_W}
          height={height}
          style={{ fill: "var(--panel-2)" }}
        />
        {gridX.map((x) => (
          <line
            key={`x${x}`}
            x1={x}
            y1={0}
            x2={x}
            y2={height}
            strokeWidth={0.5}
            style={{ stroke: "var(--line-soft)" }}
          />
        ))}
        {gridY.map((y) => (
          <line
            key={`y${y}`}
            x1={0}
            y1={y}
            x2={VIEW_W}
            y2={y}
            strokeWidth={0.5}
            style={{ stroke: "var(--line-soft)" }}
          />
        ))}

        {route.length >= 2 && (
          <polyline
            points={routePoints}
            fill="none"
            strokeWidth={1.4}
            strokeDasharray="5 5"
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ stroke: "var(--thread)", opacity: 0.55 }}
          />
        )}

        {spots.map((s) => {
          const p = projectPoint(s.pos, bounds, VIEW_W, height);
          const acquired = acquiredIds.has(s.id);
          const highlighted = s.id === highlightId;
          const focused = onSelect !== undefined && focusedId === s.id;
          const r = highlighted ? 15 : 12;
          const stateLabel = acquired ? "獲得済み" : "未取得";
          return (
            <g
              key={s.id}
              role={onSelect ? "button" : undefined}
              tabIndex={onSelect ? 0 : undefined}
              aria-label={`${s.order}番 ${s.name}（${stateLabel}）`}
              style={{
                cursor: onSelect ? "pointer" : "default",
                outline: "none",
              }}
              onClick={onSelect ? () => onSelect(s.id) : undefined}
              onFocus={onSelect ? () => setFocusedId(s.id) : undefined}
              onBlur={onSelect ? () => setFocusedId(null) : undefined}
              onKeyDown={
                onSelect
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(s.id);
                      }
                    }
                  : undefined
              }
            >
              <title>
                {s.order}. {s.name}（{stateLabel}）
              </title>
              {focused && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r + 6}
                  fill="none"
                  strokeWidth={2}
                  style={{ stroke: "var(--thread)" }}
                />
              )}
              {highlighted && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r + 7}
                  fill="none"
                  strokeWidth={1}
                  style={{ stroke: "var(--thread)", opacity: 0.6 }}
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={r}
                strokeWidth={acquired ? 1.5 : 1}
                strokeDasharray={acquired ? undefined : "3 2"}
                style={{
                  fill: acquired ? "var(--indigo)" : "var(--panel-2)",
                  stroke: acquired ? "var(--thread)" : "var(--line)",
                }}
              />
              <text
                x={p.x}
                y={p.y + 4}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                style={{
                  fill: acquired ? "var(--on-accent)" : "var(--fog-dim)",
                  fontFamily: "var(--font-num)",
                }}
              >
                {s.order}
              </text>
            </g>
          );
        })}

        {userPoint && (
          <g aria-label="現在地">
            <title>現在地</title>
            <circle
              cx={userPoint.x}
              cy={userPoint.y}
              r={16}
              fill="none"
              strokeWidth={1}
              style={{ stroke: "var(--selvedge)", opacity: 0.25 }}
            />
            <circle
              cx={userPoint.x}
              cy={userPoint.y}
              r={10}
              fill="none"
              strokeWidth={1}
              style={{ stroke: "var(--selvedge)", opacity: 0.45 }}
            />
            <circle
              cx={userPoint.x}
              cy={userPoint.y}
              r={5}
              strokeWidth={1.5}
              style={{ fill: "var(--selvedge)", stroke: "var(--fog)" }}
            />
          </g>
        )}
      </svg>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          padding: "8px 10px 9px",
          borderTop: "1px solid var(--line-soft)",
        }}
      >
        <LegendSwatch kind="acquired" label="獲得済み" />
        <LegendSwatch kind="pending" label="未取得" />
        {userPoint && <LegendSwatch kind="here" label="現在地" />}
      </div>
    </div>
  );
}
