import { Link } from "react-router-dom";
import JeansStamp from "../components/JeansStamp";
import NearbySpots from "../components/NearbySpots";
import { useRally } from "../hooks/useRally";

export default function TopPage() {
  const { checkpoints, acquiredIds, total, done } = useRally();
  const started = done > 0;
  const remaining = total - done;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
      <section className="hero">
        <span className="kicker" style={{ color: "var(--fog-soft)" }}>
          岡山県倉敷市 児島
        </span>
        <h1>
          児島を歩いて、
          <br />
          一本のジーンズを。
        </h1>
        <JeansStamp checkpoints={checkpoints} acquiredIds={acquiredIds} />
        <p className="lead">
          集めたピースだけが藍に染まる。町に置かれたQRコードを読み取って、あなただけの一本を完成させてください。
        </p>
        <p className="muted" style={{ marginTop: -6 }}>
          {started
            ? `あと ${remaining} ピースで、一本のジーンズが完成します。`
            : "まだ0件です。最初のQRコードを読み取ると、ここから藍が染まりはじめます。"}
        </p>
        <Link to="/scan" className="btn-primary" style={{ marginTop: 4 }}>
          {started ? "次のピースを読み取る" : "最初のQRコードを読み取る"}
        </Link>
        <Link to="/login" className="btn-ghost" style={{ fontSize: 13, padding: "8px 14px" }}>
          登録済みの方：別端末からログイン
        </Link>
      </section>

      <NearbySpots
        checkpoints={checkpoints}
        acquiredIds={acquiredIds}
        limit={3}
      />

      <section>
        <div className="section-title">巡り方</div>
        <ol style={{ listStyle: "none" }}>
          {[
            "児島の各スポットでQRコードを探す",
            "スマホで読み取ると、ジーンズのピースが藍に染まる",
            "全部集めると、一本のジーンズが完成する",
          ].map((text, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                gap: 16,
                alignItems: "baseline",
                padding: "16px 0",
                borderBottom: "1px solid var(--line-soft)",
              }}
            >
              <span
                className="num"
                style={{
                  fontSize: 28,
                  color: "var(--fog-dim)",
                  minWidth: 34,
                  lineHeight: 1,
                }}
              >
                {i + 1}
              </span>
              <span style={{ fontSize: 14.5, color: "var(--fog-soft)" }}>
                {text}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <div className="section-title">児島という町</div>
        <p className="lead" style={{ marginTop: 14 }}>
          瀬戸内海に面した倉敷市児島は、日本で初めて国産ジーンズが生まれた町です。
          ジーンズストリート、旧野﨑家住宅、鷲羽山からの瀬戸大橋。
          歩いて巡るほど、この町の手ざわりが見えてきます。
        </p>
      </section>
    </div>
  );
}
