import { NavLink, Outlet } from "react-router-dom";
import { useState, useRef } from "react";

export default function Layout() {
  const [tapCount, setTapCount] = useState(0);
  const timerRef = useRef<number | null>(null);

  const handleFooterTap = () => {
    const next = tapCount + 1;
    setTapCount(next);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setTapCount(0), 3000);
    if (next >= 5) {
      setTapCount(0);
      window.location.hash = "#admin";
      window.location.pathname !== "/admin" && (window.location.href = "/admin");
    }
  };

  return (
    <div className="page">
      <header className="header" style={{ background: "#1e3a5f" }}>
        <h1>👖 児島ジーンズラリー</h1>
        <nav>
          <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>トップ</NavLink>
          <NavLink to="/stamps" className={({ isActive }) => isActive ? "active" : ""}>マイスタンプ</NavLink>
          <NavLink to="/scan" className={({ isActive }) => isActive ? "active" : ""}>QR読取</NavLink>
        </nav>
      </header>
      <main style={{ flex: 1, padding: 16 }}>
        <Outlet />
      </main>
      <footer
        onClick={handleFooterTap}
        style={{ textAlign: "center", padding: "12px 0", fontSize: 12, color: "#9ca3af", userSelect: "none" }}
      >
        児島ジーンズスタンプラリー — 地域を巡ってジーンズを完成させよう
        {tapCount > 0 && tapCount < 5 && (
          <span style={{ marginLeft: 8, fontSize: 10, color: "#d1d5db" }}>({tapCount}/5)</span>
        )}
      </footer>
    </div>
  );
}
