import { NavLink, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="page">
      <header className="header" style={{ background: "#1e3a5f" }}>
        <h1>👖 児島ジーンズラリー</h1>
        <nav>
          <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>トップ</NavLink>
          <NavLink to="/stamps" className={({ isActive }) => isActive ? "active" : ""}>マイスタンプ</NavLink>
          <NavLink to="/scan" className={({ isActive }) => isActive ? "active" : ""}>QR読取</NavLink>
          <NavLink to="/admin" className={({ isActive }) => isActive ? "active" : ""}>管理</NavLink>
        </nav>
      </header>
      <main style={{ flex: 1, padding: 16 }}>
        <Outlet />
      </main>
      <footer style={{ textAlign: "center", padding: "12px 0", fontSize: 12, color: "#9ca3af" }}>
        児島ジーンズスタンプラリー — 地域を巡ってジーンズを完成させよう
      </footer>
    </div>
  );
}
