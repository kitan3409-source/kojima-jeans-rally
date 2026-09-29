import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useProfile } from "../hooks/useProfile";

export default function ProfilePage() {
  const { nickname, ready, save, saving, error } = useProfile();
  const [value, setValue] = useState("");
  const [notice, setNotice] = useState<"ok" | "err" | null>(null);

  useEffect(() => {
    if (ready) setValue(nickname);
  }, [ready, nickname]);

  const submit = async () => {
    if (saving) return;
    setNotice(null);
    const ok = await save(value);
    setNotice(ok ? "ok" : "err");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h1 className="display">ニックネーム</h1>
        <p className="lead" style={{ marginTop: 6 }}>
          認定証やシェアに使われます。1〜24文字。
        </p>
      </div>

      <div className="panel panel--stitch">
        {ready ? (
          <div className="stack">
            <label className="muted" htmlFor="nickname">
              ニックネーム
            </label>
            <input
              id="nickname"
              className="field"
              value={value}
              maxLength={24}
              autoComplete="nickname"
              enterKeyHint="done"
              placeholder="例）児島 太郎"
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void submit();
                }
              }}
            />
            <div className="muted" style={{ textAlign: "right" }}>
              {value.trim().length} / 24
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={submit}
              disabled={saving}
            >
              {saving ? "保存中..." : "保存する"}
            </button>
          </div>
        ) : (
          <div className="stack" aria-hidden="true">
            <div className="skeleton" style={{ width: "35%", height: 12 }} />
            <div className="skeleton" style={{ width: "100%", height: 44 }} />
            <div className="skeleton" style={{ width: "25%", height: 12, marginLeft: "auto" }} />
            <div className="skeleton" style={{ width: "100%", height: 48 }} />
          </div>
        )}
      </div>

      <div role="status" aria-live="polite">
        {notice === "ok" && (
          <div className="notice notice--ok">保存しました。</div>
        )}
        {(notice === "err" || (error && notice !== "ok")) && (
          <div className="notice notice--err">
            {error ?? "保存できませんでした。"}
          </div>
        )}
      </div>

      <div className="stack">
        <Link to="/complete" className="btn-ghost">
          完成画面へ戻る
        </Link>
        <Link to="/stamps" className="btn-ghost">
          スタンプ一覧へ
        </Link>
      </div>
    </div>
  );
}
