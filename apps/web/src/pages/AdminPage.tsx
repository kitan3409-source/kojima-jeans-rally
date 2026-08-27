import { useEffect, useState } from "react";

export default function AdminPage() {
  const [token, setToken] = useState(localStorage.getItem("admin_token") ?? "");
  const [authed, setAuthed] = useState(false);
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", description: "", order: 1, qrCodeValue: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const headers = { "Content-Type": "application/json", "X-Admin-Token": token };

  const load = async () => {
    const r = await fetch("/api/checkpoints");
    setCheckpoints(await r.json());
  };
  useEffect(() => { load(); }, []);

  const login = () => {
    localStorage.setItem("admin_token", token);
    // test auth by trying to fetch with token
    fetch("/api/checkpoints", { headers: { "X-Admin-Token": token } }).then(() => setAuthed(true));
    setAuthed(true);
  };

  const submit = async () => {
    if (!form.name || !form.qrCodeValue) { setMsg("名前とQR値は必須です"); return; }
    const url = editingId ? `/api/checkpoints/${editingId}` : "/api/checkpoints";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setMsg(data.error ?? "エラー"); return; }
    setMsg(editingId ? "更新しました" : "登録しました");
    setForm({ name: "", description: "", order: checkpoints.length + 1, qrCodeValue: "" });
    setEditingId(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("削除しますか？")) return;
    await fetch(`/api/checkpoints/${id}`, { method: "DELETE", headers });
    load();
  };

  const edit = (cp: any) => {
    setForm({ name: cp.name, description: cp.description, order: cp.order, qrCodeValue: cp.qrCodeValue });
    setEditingId(cp.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!authed) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>管理画面ログイン</h2>
        <p style={{ fontSize: 13, color: "#6b7280" }}>デフォルトパスワード: <code>kojima2026</code></p>
        <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Admin Token" style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }} />
        <button className="btn-primary" onClick={login}>ログイン</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2>管理画面</h2>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#6b7280" }}>チェックポイント数: {checkpoints.length} → ピザは{checkpoints.length}分割に自動再計算されます</span>
        <button onClick={() => { localStorage.removeItem("admin_token"); setAuthed(false); }} style={{ marginLeft: "auto", fontSize: 12, background: "none", border: "1px solid #d1d5db", borderRadius: 6, padding: "4px 8px" }}>ログアウト</button>
      </div>

      {msg && <div style={{ padding: 10, background: "#fef3c7", borderRadius: 8, fontSize: 13 }}>{msg}</div>}

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h3 style={{ fontSize: 14 }}>{editingId ? "編集" : "新規登録"}</h3>
        <input placeholder="名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }} />
        <textarea placeholder="説明" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db", minHeight: 60 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>順序 <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} style={{ width: 60, padding: 6, borderRadius: 6, border: "1px solid #d1d5db" }} /></label>
        </div>
        <input placeholder="QRコード値（ユニーク）" value={form.qrCodeValue} onChange={(e) => setForm({ ...form, qrCodeValue: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" onClick={submit} style={{ flex: 1 }}>{editingId ? "更新" : "登録"}</button>
          {editingId && <button className="btn-secondary" onClick={() => { setEditingId(null); setForm({ name: "", description: "", order: checkpoints.length + 1, qrCodeValue: "" }); }}>キャンセル</button>}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {checkpoints.map((cp) => (
          <div key={cp.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{cp.order}. {cp.name}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{cp.description}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", wordBreak: "break-all" }}>QR: {cp.qrCodeValue}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button onClick={() => edit(cp)} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff" }}>編集</button>
              <button onClick={() => remove(cp.id)} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 6, border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626" }}>削除</button>
              <a href={`/api/qr/${cp.id}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, padding: "6px 12px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff" }}>QR画像を表示</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
