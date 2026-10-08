import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Checkpoint = {
  id: string;
  name: string;
  description: string;
  order: number;
  qrCodeValue?: string;
};

const TOKEN_KEY = "admin_token";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

export default function AdminPage() {
  const [token, setToken] = useState(sessionStorage.getItem(TOKEN_KEY) ?? "");
  const [authed, setAuthed] = useState(() =>
    !!sessionStorage.getItem(TOKEN_KEY)
  );
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    order: 1,
    qrCodeValue: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [qrModal, setQrModal] = useState<Checkpoint | null>(null);
  const [qrModalSrc, setQrModalSrc] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const headers = { "Content-Type": "application/json", "X-Admin-Token": token };

  const load = async () => {
    const r = await fetch("/api/checkpoints", { headers: { "X-Admin-Token": token } });
    setCheckpoints(await r.json());
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [authed]);

  useEffect(() => {
    if (!authed || !token) return;
    fetch("/api/admin/verify", { headers: { "X-Admin-Token": token } })
      .then((r) => {
        if (!r.ok) {
          sessionStorage.removeItem(TOKEN_KEY);
          setAuthed(false);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!qrModal) {
      setQrModalSrc(null);
      return;
    }
    let url: string | null = null;
    let cancelled = false;
    fetch(`/api/qr/${qrModal.id}`, { headers: { "X-Admin-Token": token } })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setQrModalSrc(url);
      })
      .catch(() => {
        if (!cancelled) setMsg({ type: "error", text: "QR画像の取得に失敗しました。" });
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [qrModal, token]);

  const login = async () => {
    if (!token.trim()) {
      setMsg({ type: "error", text: "パスワードを入力してください。" });
      return;
    }
    const res = await fetch("/api/admin/verify", {
      headers: { "X-Admin-Token": token },
    }).catch(() => null);
    if (!res || !res.ok) {
      setMsg({
        type: "error",
        text:
          res?.status === 429
            ? "試行回数が多すぎます。しばらく待ってからお試しください。"
            : "パスワードが違います。",
      });
      return;
    }
    sessionStorage.setItem(TOKEN_KEY, token);
    setAuthed(true);
    setMsg(null);
  };

  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setAuthed(false);
    setToken("");
  };

  const submit = async () => {
    if (!form.name.trim() || !form.qrCodeValue.trim()) {
      setMsg({ type: "error", text: "名称とQR値は必須です。" });
      return;
    }
    const url = editingId ? `/api/checkpoints/${editingId}` : "/api/checkpoints";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        setMsg({ type: "error", text: "認証エラー。再ログインしてください。" });
        setAuthed(false);
        return;
      }
      setMsg({
        type: "error",
        text: data.error ?? "保存できませんでした。",
      });
      return;
    }
    setMsg({
      type: "success",
      text: editingId ? "更新しました。" : "登録しました。",
    });
    setForm({ name: "", description: "", order: checkpoints.length + 1, qrCodeValue: "" });
    setEditingId(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("削除しますか？この操作は元に戻せません。")) return;
    const res = await fetch(`/api/checkpoints/${id}`, {
      method: "DELETE",
      headers,
    });
    if (res.status === 401) {
      setMsg({ type: "error", text: "認証エラー。" });
      setAuthed(false);
      return;
    }
    load();
  };

  const edit = (cp: Checkpoint) => {
    setForm({
      name: cp.name,
      description: cp.description,
      order: cp.order,
      qrCodeValue: cp.qrCodeValue ?? "",
    });
    setEditingId(cp.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const autoGenerateQr = () => {
    const slug =
      form.name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "") || "spot";
    setForm({ ...form, qrCodeValue: `kojima-${slug}-${Date.now().toString(36)}` });
  };

  const downloadQr = async (cp: Checkpoint) => {
    try {
      const res = await fetch(`/api/qr/${cp.id}`, { headers: { "X-Admin-Token": token } });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-${cp.qrCodeValue}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMsg({ type: "error", text: "QR画像の取得に失敗しました。" });
    }
  };

  const printAllQr = async () => {
    let images: string[];
    try {
      images = await Promise.all(
        checkpoints.map(async (cp) => {
          const res = await fetch(`/api/qr/${cp.id}`, { headers: { "X-Admin-Token": token } });
          if (!res.ok) throw new Error(String(res.status));
          const blob = await res.blob();
          return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          });
        })
      );
    } catch {
      setMsg({ type: "error", text: "QR画像の取得に失敗しました。" });
      return;
    }
    const w = window.open("", "_blank");
    if (!w) return;
    const rows = checkpoints
      .map(
        (cp, i) => `
      <div style="page-break-inside:avoid; text-align:center; border:1px dashed #8aa2c4; border-radius:3px; padding:16px; margin:12px;">
        <div style="font-family:serif; font-weight:700; font-size:16px;">${cp.order}. ${escapeHtml(cp.name)}</div>
        <div style="font-size:12px; color:#5c6a80; margin:4px 0;">${escapeHtml(cp.description)}</div>
        <img src="${images[i]}" style="width:200px; height:200px; margin:8px auto; display:block;" />
        <div style="font-size:11px; color:#8a94a8; word-break:break-all;">${escapeHtml(cp.qrCodeValue ?? "")}</div>
        <div style="font-size:10px; color:#9aa7ba;">このQRを現地に掲示してください</div>
      </div>`
      )
      .join("");
    w.document.write(
      `<html><head><title>QR一括印刷</title><style>@media print{body{margin:0}}</style></head><body><h1 style="text-align:center; font-family:serif;">児島ジーンズスタンプラリー QRコード一覧</h1>${rows}<script>window.onload=()=>window.print()<\/script></body></html>`
    );
    w.document.close();
  };

  const handleDragStart = (id: string) => setDragId(id);
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;
  };
  const handleDrop = async (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const fromIdx = checkpoints.findIndex((c) => c.id === dragId);
    const toIdx = checkpoints.findIndex((c) => c.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const reordered = [...checkpoints];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const updated = reordered.map((c, i) => ({ ...c, order: i + 1 }));
    setCheckpoints(updated);
    setDragId(null);
    for (const c of updated) {
      await fetch(`/api/checkpoints/${c.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ order: c.order }),
      });
    }
    load();
  };

  if (!authed) {
    return (
      <div
        className="panel panel--stitch"
        style={{ maxWidth: 340, margin: "40px auto" }}
      >
        <div className="panel__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h1 className="display" style={{ textAlign: "center" }}>
            管理コンソール
          </h1>
          <p className="muted" style={{ textAlign: "center" }}>
            パスワードを入力してください。
          </p>
          {msg && <div className="notice notice--err">{msg.text}</div>}
          <input
            className="field"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="パスワード"
          />
          <button className="btn-primary" onClick={login}>
            ログイン
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h1 className="display">管理コンソール</h1>
        <button onClick={logout} style={{ ...smBtn(), marginLeft: "auto" }}>
          ログアウト
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span className="tag">
          {checkpoints.length}箇所 / ジーンズは{checkpoints.length}分割
        </span>
        {checkpoints.length > 0 && (
          <button onClick={printAllQr} style={{ ...smBtn(), width: "auto" }}>
            QRを一括印刷
          </button>
        )}
        <Link
          to="/admin/stats"
          style={{
            ...smBtn(),
            display: "inline-flex",
            alignItems: "center",
            minHeight: 44,
            textDecoration: "none",
          }}
        >
          統計を見る
        </Link>
        <Link
          to="/admin/survey"
          style={{
            ...smBtn(),
            display: "inline-flex",
            alignItems: "center",
            minHeight: 44,
            textDecoration: "none",
          }}
        >
          アンケート結果
        </Link>
      </div>

      {msg && (
        <div
          className={`notice ${
            msg.type === "success" ? "notice--ok" : "notice--err"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="panel">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h3 className="display">{editingId ? "スポットを編集" : "新しいスポット"}</h3>
          <input
            className="field"
            placeholder="名称（例: 児島ジーンズストリート）"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <textarea
            className="field"
            placeholder="説明"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
          />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              順序
              <input
                type="number"
                className="field"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                style={{ width: 72 }}
              />
            </label>
            <span className="muted">ジーンズの上からの順番</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="field"
              placeholder="QRコード値（ユニーク）"
              value={form.qrCodeValue}
              onChange={(e) => setForm({ ...form, qrCodeValue: e.target.value })}
              style={{ flex: 1, fontSize: 13 }}
            />
            <button onClick={autoGenerateQr} style={{ ...smBtn(), width: "auto" }}>
              自動生成
            </button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={submit} style={{ flex: 1 }}>
              {editingId ? "更新する" : "登録する"}
            </button>
            {editingId && (
              <button
                className="btn-ghost"
                style={{ width: "auto" }}
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    name: "",
                    description: "",
                    order: checkpoints.length + 1,
                    qrCodeValue: "",
                  });
                  setMsg(null);
                }}
              >
                キャンセル
              </button>
            )}
          </div>
        </div>
      </div>

      <h3 className="display" style={{ fontSize: 14 }}>
        登録済みのスポット（ドラッグで並び替え）
      </h3>
      <div className="stack">
        {checkpoints.map((cp) => (
          <div
            key={cp.id}
            draggable
            onDragStart={() => handleDragStart(cp.id)}
            onDragOver={(e) => handleDragOver(e, cp.id)}
            onDrop={() => handleDrop(cp.id)}
            className="panel"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              cursor: "grab",
              opacity: dragId === cp.id ? 0.4 : 1,
              borderLeft: "3px solid var(--indigo)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ cursor: "grab", color: "var(--line)" }}>⋮⋮</span>
              <span className="display" style={{ fontSize: 14, flex: 1 }}>
                {cp.order}. {cp.name}
              </span>
              <span className="tag">{(cp.qrCodeValue ?? "").slice(0, 18)}</span>
            </div>
            {cp.description && (
              <div style={{ fontSize: 12.5, color: "var(--fog-soft)" }}>
                {cp.description}
              </div>
            )}
            <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
              <button onClick={() => edit(cp)} style={smBtn()}>
                編集
              </button>
              <button onClick={() => remove(cp.id)} style={smBtn(true)}>
                削除
              </button>
              <button onClick={() => setQrModal(cp)} style={smBtn()}>
                QR表示
              </button>
              <button onClick={() => downloadQr(cp)} style={smBtn()}>
                PNG保存
              </button>
            </div>
          </div>
        ))}
        {checkpoints.length === 0 && (
          <p className="muted" style={{ textAlign: "center", padding: 20 }}>
            まだスポットが登録されていません。
          </p>
        )}
      </div>

      {qrModal && (
        <div
          onClick={() => setQrModal(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11,19,34,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="panel panel--stitch"
            style={{ maxWidth: 340, width: "100%", textAlign: "center" }}
          >
            <div className="panel__body">
              <div className="display" style={{ fontWeight: 700 }}>
                {qrModal.order}. {qrModal.name}
              </div>
              <div className="muted" style={{ marginTop: 4 }}>
                {qrModal.description}
              </div>
              {qrModalSrc && (
                <img
                  src={qrModalSrc}
                  alt="QRコード"
                  style={{
                    width: 220,
                    height: 220,
                    margin: "12px auto",
                    display: "block",
                    border: "1px dashed var(--line)",
                    borderRadius: 3,
                  }}
                />
              )}
              <div
                style={{
                  fontSize: 11,
                  color: "var(--fog-soft)",
                  wordBreak: "break-all",
                  background: "var(--panel-2)",
                  padding: 8,
                  borderRadius: 3,
                }}
              >
                {qrModal.qrCodeValue}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  onClick={() => downloadQr(qrModal)}
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  PNG保存
                </button>
                <button
                  onClick={() => setQrModal(null)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function smBtn(danger = false): React.CSSProperties {
  return {
    fontSize: 12,
    padding: "6px 12px",
    borderRadius: 3,
    border: `1px solid ${danger ? "rgba(200,69,47,0.5)" : "var(--line)"}`,
    background: danger ? "rgba(200,69,47,0.12)" : "var(--panel-2)",
    color: danger ? "var(--danger-fg)" : "var(--fog-soft)",
    width: "auto",
  };
}
