import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useProfile } from "../hooks/useProfile";
import { useAccount, validateLoginId } from "../hooks/useAccount";

export default function ProfilePage() {
  const { nickname, ready, save, saving, error } = useProfile();
  const { status, busy, error: accountError, setError: setAccountError, register } = useAccount();
  const [value, setValue] = useState("");
  const [notice, setNotice] = useState<"ok" | "err" | null>(null);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (ready) setValue(nickname);
  }, [ready, nickname]);

  const submit = async () => {
    if (saving) return;
    setNotice(null);
    const ok = await save(value);
    setNotice(ok ? "ok" : "err");
  };

  const submitAccount = async () => {
    if (busy) return;
    setAccountError(null);
    const idError = validateLoginId(loginId);
    if (idError) {
      setAccountError(idError);
      return;
    }
    if (password.length < 6 || password.length > 72) {
      setAccountError("パスワードは6〜72文字で入力してください。");
      return;
    }
    if (password !== password2) {
      setAccountError("パスワードが一致しません。");
      return;
    }
    const ok = await register(loginId, password);
    if (ok) {
      setRegistered(true);
      setPassword("");
      setPassword2("");
    }
  };

  const accountReady = status !== null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h1 className="display">プロフィール</h1>
        <p className="lead" style={{ marginTop: 6 }}>
          ニックネームは認定証やシェアに使われます。1〜24文字。
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

      <section>
        <div className="section-title">アカウント</div>
        <div className="panel panel--stitch">
          {!accountReady ? (
            <div className="stack" aria-hidden="true">
              <div className="skeleton" style={{ width: "45%", height: 12 }} />
              <div className="skeleton" style={{ width: "100%", height: 44 }} />
            </div>
          ) : status?.registered ? (
            <div className="stack">
              <p style={{ fontSize: 14, margin: 0 }}>
                ログインID：<b>{status.loginId}</b>
              </p>
              <p className="muted" style={{ fontSize: 13, margin: 0, lineHeight: 1.7 }}>
                このIDとパスワードで、別の端末から記録を復元できます。IDとパスワードは大切に保管してください。
              </p>
              <Link to="/login" className="btn-ghost">
                この端末でログインし直す
              </Link>
            </div>
          ) : registered ? (
            <div className="notice notice--ok" role="status">
              アカウントを作成しました。IDとパスワードを控えておくと、別の端末でも記録を復元できます。
            </div>
          ) : (
            <div className="stack">
              <p className="muted" style={{ fontSize: 13, margin: 0, lineHeight: 1.7 }}>
                IDとパスワードを登録すると、機種変更や別の端末でもスタンプの記録を復元できます。
              </p>
              <label className="muted" htmlFor="reg-login-id">
                ログインID（半角英数字・_・-、3〜24文字）
              </label>
              <input
                id="reg-login-id"
                className="field"
                value={loginId}
                maxLength={24}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                inputMode="text"
                placeholder="例）kojima-taro"
                onChange={(e) => setLoginId(e.target.value)}
              />
              <label className="muted" htmlFor="reg-password">
                パスワード（6〜72文字）
              </label>
              <input
                id="reg-password"
                className="field"
                type="password"
                value={password}
                maxLength={72}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <label className="muted" htmlFor="reg-password2">
                パスワード（確認）
              </label>
              <input
                id="reg-password2"
                className="field"
                type="password"
                value={password2}
                maxLength={72}
                autoComplete="new-password"
                enterKeyHint="done"
                onChange={(e) => setPassword2(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void submitAccount();
                  }
                }}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={() => void submitAccount()}
                disabled={busy}
              >
                {busy ? "登録中..." : "アカウントを作成する"}
              </button>
              <Link to="/login" className="btn-ghost">
                登録済みのIDでログインする
              </Link>
            </div>
          )}
        </div>
        <div role="status" aria-live="polite">
          {accountError && (
            <div className="notice notice--err" style={{ marginTop: 10 }}>
              {accountError}
            </div>
          )}
        </div>
      </section>

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
