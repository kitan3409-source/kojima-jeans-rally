import { useState } from "react";
import { Link } from "react-router-dom";
import { login, validateLoginId } from "../hooks/useAccount";

export default function LoginPage() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (sending) return;
    setError(null);
    const idError = validateLoginId(loginId);
    if (idError) {
      setError(idError);
      return;
    }
    if (!password) {
      setError("パスワードを入力してください。");
      return;
    }
    setSending(true);
    const result = await login(loginId, password);
    setSending(false);
    if (result.ok) {
      // reload so every hook picks up the restored user id
      window.location.href = "/";
      return;
    }
    setError(result.message);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h1 className="display">ログイン</h1>
        <p className="lead" style={{ marginTop: 6 }}>
          登録したIDとパスワードで、別の端末にも記録を復元できます。
        </p>
      </div>

      <div className="panel panel--stitch">
        <div className="stack">
          <label className="muted" htmlFor="login-id">
            ログインID
          </label>
          <input
            id="login-id"
            className="field"
            value={loginId}
            maxLength={24}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            inputMode="text"
            enterKeyHint="next"
            placeholder="例）kojima-taro"
            onChange={(e) => setLoginId(e.target.value)}
          />
          <label className="muted" htmlFor="login-password">
            パスワード
          </label>
          <input
            id="login-password"
            className="field"
            type="password"
            value={password}
            maxLength={72}
            autoComplete="current-password"
            enterKeyHint="done"
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submit();
              }
            }}
          />
          <button
            type="button"
            className="btn-primary"
            onClick={() => void submit()}
            disabled={sending}
          >
            {sending ? "確認中..." : "ログインして記録を復元"}
          </button>
        </div>
      </div>

      {error && (
        <div className="notice notice--err" role="status" aria-live="polite">
          {error}
        </div>
      )}

      <div className="stack">
        <p className="muted" style={{ fontSize: 13 }}>
          アカウントをまだ作っていない場合は、記録のある端末のプロフィール画面から登録できます。
        </p>
        <Link to="/profile" className="btn-ghost">
          プロフィールへ
        </Link>
        <Link to="/" className="btn-ghost">
          トップへ戻る
        </Link>
      </div>
    </div>
  );
}
