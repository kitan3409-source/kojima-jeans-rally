import { useEffect, useState } from "react";

type Checkpoint = { id: string; name: string; description: string; order: number; qrCodeValue: string };

export default function AdminPage() {
  const [token, setToken] = useState(localStorage.getItem("admin_token") ?? "");
  const [authed, setAuthed] = useState(() => {
    // auto-login if token exists
    return !!localStorage.getItem("admin_token");
  });
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [form, setForm] = useState({ name: "", description: "", order: 1, qrCodeValue: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [qrModal, setQrModal] = useState<Checkpoint | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const headers = { "Content-Type": "application/json", "X-Admin-Token": token };

  const load = async () => {
    const r = await fetch("/api/checkpoints");
    setCheckpoints(await r.json());
  };
  useEffect(() => { load(); }, []);

  // verify token on mount if authed
  useEffect(() => {
    if (!authed || !token) return;
    fetch("/api/checkpoints", { method: "POST", headers }).then((r) => {
      // we just check if token is wrong via a dummy request; if 401 fallback to login
      if (r.status === 401) setAuthed(false);
    }).catch(() => {});
    // eslint-disable-next-line
  }, []);

  const login = () => {
    if (!token.trim()) { setMsg({ type: "error", text: "パスワードを入力してください" }); return; }
    localStorage.setItem("admin_token", token);
    setAuthed(true);
    setMsg(null);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setAuthed(false);
    setToken("");
  };

  const submit = async () => {
    if (!form.name.trim() || !form.qrCodeValue.trim()) { setMsg({ type: "error", text: "名称とQR値は必須です" }); return; }
    const url = editingId ? `/api/checkpoints/${editingId}` : "/api/checkpoints";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) { setMsg({ type: "error", text: "認証エラー。再ログインしてください" }); setAuthed(false); return; }
      setMsg({ type: "error", text: data.error ?? "エラーが発生しました" }); return;
    }
    setMsg({ type: "success", text: editingId ? "更新しました" : "登録しました" });
    setForm({ name: "", description: "", order: checkpoints.length + 1, qrCodeValue: "" });
    setEditingId(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("削除しますか？この操作は元に戻せません。")) return;
    const res = await fetch(`/api/checkpoints/${id}`, { method: "DELETE", headers });
    if (res.status === 401) { setMsg({ type: "error", text: "認証エラー" }); setAuthed(false); return; }
    load();
  };

  const edit = (cp: Checkpoint) => {
    setForm({ name: cp.name, description: cp.description, order: cp.order, qrCodeValue: cp.qrCodeValue });
    setEditingId(cp.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const autoGenerateQr = () => {
    const slug = form.name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "spot";
    setForm({ ...form, qrCodeValue: `kojima-${slug}-${Date.now().toString(36)}` });
  };

  const downloadQr = async (cp: Checkpoint) => {
    try {
      const res = await fetch(`/api/qr/${cp.id}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `qr-${cp.qrCodeValue}.png`; a.click();
      URL.revokeObjectURL(url);
    } catch { setMsg({ type: "error", text: "QR画像の取得に失敗しました" }); }
  };

  const printAllQr = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const rows = checkpoints.map((cp) => `
      <div style="page-break-inside:avoid; text-align:center; border:1px solid #ddd; border-radius:12px; padding:16px; margin:12px;">
        <div style="font-weight:700; font-size:16px;">${cp.order}. ${cp.name}</div>
        <div style="font-size:12px; color:#666; margin:4px 0;">${cp.description}</div>
        <img src="/api/qr/${cp.id}" style="width:200px; height:200px; margin:8px auto; display:block;" />
        <div style="font-size:11px; color:#999; word-break:break-all;">${cp.qrCodeValue}</div>
        <div style="font-size:10px; color:#aaa;">このQRを現地に掲示してください</div>
      </div>
    `).join("");
    w.document.write(`<html><head><title>QR一括印刷</title><style>@media print{body{margin:0}}</style></head><body><h1 style="text-align:center;">児島ジーンズスタンプラリー QRコード一覧</h1>${rows}<script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  };

  // drag reorder
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
    // optimistic update
    const updated = reordered.map((c, i) => ({ ...c, order: i + 1 }));
    setCheckpoints(updated);
    setDragId(null);
    // persist
    for (const c of updated) {
      await fetch(`/api/checkpoints/${c.id}`, { method: "PUT", headers, body: JSON.stringify({ order: c.order }) });
    }
    load();
  };

  if (!authed) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 360, margin: "40px auto" }}>
        <h2 style={{ textAlign: "center" }}>🔒 管理画面</h2>
        <p style={{ fontSize: 13, color: "#6b7280", textAlign: "center" }}>パスワードを入力してください</p>
        {msg && <div style={{ padding: 10, background: "#fee2e2", color: "#991b1b", borderRadius: 8, fontSize: 13, textAlign: "center" }}>{msg.text}</div>}
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
          placeholder="パスワード"
          style={{ padding: 14, borderRadius: 12, border: "1px solid #d1d5db", fontSize: 16 }}
        />
        <button className="btn-primary" onClick={login}>ログイン</button>
        <a href="/" style={{ textAlign: "center", fontSize: 13, color: "#6b7280" }}>← トップに戻る</a>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h2>🔧 管理画面</h2>
        <button onClick={logout} style={{ marginLeft: "auto", fontSize: 12, background: "none", border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px" }}>ログアウト</button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "#6b7280", background: "#eff6ff", padding: "6px 10px", borderRadius: 20 }}>
          📍 {checkpoints.length}箇所 → ジーンズは{checkpoints.length}分割
        </span>
        {checkpoints.length > 0 && (
          <button onClick={printAllQr} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 20, border: "1px solid #1e3a5f", background: "#fff", color: "#1e3a5f" }}>🖨️ QRを一括印刷</button>
        )}
      </div>

      {msg && <div style={{ padding: 10, borderRadius: 8, fontSize: 13, background: msg.type === "success" ? "#dbeafe" : "#fee2e2", color: msg.type === "success" ? "#1e40af" : "#991b1b" }}>{msg.text}</div>}

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h3 style={{ fontSize: 14 }}>{editingId ? "✏️ 編集" : "➕ 新しい場所を登録"}</h3>
        <input placeholder="名称（例: 児島ジーンズストリート）" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }} />
        <textarea placeholder="説明" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }} />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>順序 <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} style={{ width: 64, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }} /></label>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>※ジーンズの上からの順番</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="QRコード値（ユニーク）" value={form.qrCodeValue} onChange={(e) => setForm({ ...form, qrCodeValue: e.target.value })} style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }} />
          <button onClick={autoGenerateQr} style={{ fontSize: 12, padding: "0 12px", borderRadius: 8, border: "1px solid #d1d5db", background: "#f3f4f6", whiteSpace: "nowrap" }}>自動生成</button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" onClick={submit} style={{ flex: 1 }}>{editingId ? "更新する" : "登録する"}</button>
          {editingId && <button className="btn-secondary" onClick={() => { setEditingId(null); setForm({ name: "", description: "", order: checkpoints.length + 1, qrCodeValue: "" }); setMsg(null); }}>キャンセル</button>}
        </div>
      </div>

      <h3 style={{ fontSize: 14, color: "#374151" }}>登録済みの場所（ドラッグで並び替え）</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {checkpoints.map((cp) => (
          <div
            key={cp.id}
            draggable
            onDragStart={() => handleDragStart(cp.id)}
            onDragOver={(e) => handleDragOver(e, cp.id)}
            onDrop={() => handleDrop(cp.id)}
            className="card"
            style={{ display: "flex", flexDirection: "column", gap: 6, cursor: "grab", opacity: dragId === cp.id ? 0.4 : 1 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ cursor: "grab", color: "#9ca3af" }}>⋮⋮</span>
              <span style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{cp.order}. {cp.name}</span>
              <span style={{ fontSize: 11, background: "#eff6ff", color: "#1e3a5f", padding: "2px 8px", borderRadius: 20 }}>{cp.qrCodeValue.slice(0, 20)}</span>
            </div>
            {cp.description && <div style={{ fontSize: 12, color: "#6b7280" }}>{cp.description}</div>}
            <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
              <button onClick={() => edit(cp)} style={smBtn()}>編集</button>
              <button onClick={() => remove(cp.id)} style={smBtn(true)}>削除</button>
              <button onClick={() => setQrModal(cp)} style={smBtn()}>QR表示</button>
              <button onClick={() => downloadQr(cp)} style={smBtn()}>⬇ PNG保存</button>
            </div>
          </div>
        ))}
        {checkpoints.length === 0 && <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: 20 }}>まだ場所が登録されていません</p>}
      </div>

      {qrModal && (
        <div onClick={() => setQrModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 20, textAlign: "center", maxWidth: 340, width: "100%" }}>
            <div style={{ fontWeight: 700 }}>{qrModal.order}. {qrModal.name}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{qrModal.description}</div>
            <img src={`/api/qr/${qrModal.id}`} alt="QR" style={{ width: 220, height: 220, margin: "12px auto", display: "block", border: "1px solid #e5e7eb", borderRadius: 8 }} />
            <div style={{ fontSize: 11, color: "#9ca3af", wordBreak: "break-all", background: "#f9fafb", padding: 8, borderRadius: 8 }}>{qrModal.qrCodeValue}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => downloadQr(qrModal)} className="btn-primary" style={{ flex: 1 }}>PNG保存</button>
              <button onClick={() => setQrModal(null)} className="btn-secondary" style={{ flex: 1 }}>閉じる</button>
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>このQRを印刷して現地に掲示してください</div>
          </div>
        </div>
      )}
    </div>
  );
}

function smBtn(danger = false): React.CSSProperties {
  return {
    fontSize: 12, padding: "6px 12px", borderRadius: 6,
    border: `1px solid ${danger ? "#fca5a5" : "#d1d5db"}`,
    background: danger ? "#fef2f2" : "#fff",
    color: danger ? "#dc2626" : "#374151",
  };
}
