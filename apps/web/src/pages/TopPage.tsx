import { Link } from "react-router-dom";

export default function TopPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <div style={{ fontSize: 64 }}>👖</div>
        <h2 style={{ fontSize: 22, marginTop: 8 }}>児島ジーンズスタンプラリー</h2>
        <p style={{ color: "#6b7280", marginTop: 8, lineHeight: 1.7 }}>
          岡山県倉敷市 児島地域を巡って<br />ジーンズを完成させよう！
        </p>
      </div>

      <div className="card" style={{ lineHeight: 1.8 }}>
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>📍 児島ってどんなところ？</h3>
        <p style={{ fontSize: 14, color: "#374151" }}>
          児島は「ジーンズの聖地」として知られる倉敷市の南部エリア。瀬戸内海の絶景、歴史ある街並み、
          そして本物のジーンズ文化が息づくまちです。QRコードを探して歩けば、児島の魅力がぎゅっと詰まった1本のジーンズが完成します。
        </p>
      </div>

      <div className="card" style={{ lineHeight: 1.8 }}>
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>🎮 遊び方</h3>
        <ol style={{ fontSize: 14, color: "#374151", paddingLeft: 20 }}>
          <li>児島の各スポットに設置されたQRコードを探そう</li>
          <li>スマホでQRを読み取るとジーンズのピースをゲット！</li>
          <li>全部集めるとジーンズが完成＆お祝い演出が待ってるよ 🎉</li>
        </ol>
      </div>

      <Link to="/stamps" className="btn-primary" style={{ textAlign: "center", display: "block", background: "#1e3a5f" }}>
        スタンプラリーを始める →
      </Link>
      <Link to="/scan" style={{ textAlign: "center", fontSize: 14, color: "#1e3a5f", fontWeight: 600 }}>
        QRを読み取る
      </Link>
    </div>
  );
}
