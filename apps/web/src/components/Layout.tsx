import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useRef, useState } from "react";
import { useRally } from "../hooks/useRally";
import { useTheme } from "../hooks/useTheme";

export default function Layout() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  const { total, done } = useRally();
  const { theme, toggle } = useTheme();
  const [tapCount, setTapCount] = useState(0);
  const timerRef = useRef<number | null>(null);

  const handleBrandTap = () => {
    const next = tapCount + 1;
    setTapCount(next);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setTapCount(0), 3000);
    if (next >= 5) {
      setTapCount(0);
      if (window.location.pathname !== "/admin") window.location.href = "/admin";
    }
  };

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isCurrent = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <div className="page">
      <header
        className="appbar"
        style={{ paddingTop: "calc(12px + env(safe-area-inset-top))" }}
      >
        <span className="brand-label" onClick={handleBrandTap}>
          児島ジーンズ
        </span>
        {isAdmin ? (
          <span className="progress" aria-label="管理者メニュー">
            管理
          </span>
        ) : (
          <span
            className="progress"
            role="status"
            aria-label={`スタンプ獲得状況 ${done} 件 / 全 ${total} 件`}
          >
            <b aria-hidden="true">{done}</b>
            <span aria-hidden="true"> / </span>
            <span aria-hidden="true">{total}</span>
          </span>
        )}
        <button
          type="button"
          className="theme-toggle"
          onClick={toggle}
          aria-label={theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"}
          title={theme === "dark" ? "ライトモード" : "ダークモード"}
        >
          <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
        </button>
        <span className="meter" style={{ width: `${pct}%` }} aria-hidden="true" />
      </header>

      <main>
        <Outlet />
      </main>

      {!isAdmin && (
        <nav className="tabbar" aria-label="メインナビゲーション">
          <NavLink
            to="/"
            end
            aria-label="トップ"
            aria-current={isCurrent("/") ? "page" : undefined}
            className={({ isActive }) => (isActive ? "active" : undefined)}
          >
            <span className="glyph" aria-hidden="true">
              巡
            </span>
            トップ
          </NavLink>
          <NavLink
            to="/stamps"
            aria-label="スタンプ"
            aria-current={isCurrent("/stamps") ? "page" : undefined}
            className={({ isActive }) => (isActive ? "active" : undefined)}
          >
            <span className="glyph" aria-hidden="true">
              藍
            </span>
            スタンプ
          </NavLink>
          <NavLink
            to="/scan"
            aria-label="読み取り"
            aria-current={isCurrent("/scan") ? "page" : undefined}
            className={({ isActive }) => (isActive ? "active" : undefined)}
          >
            <span className="glyph" aria-hidden="true">
              読
            </span>
            読み取り
          </NavLink>
        </nav>
      )}
    </div>
  );
}
