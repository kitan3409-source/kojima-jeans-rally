import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "@kojima/shared/api";
import type { SurveyAnswer, SurveyAnswers, SurveyQuestion } from "@kojima/shared/types";
import { useDeviceId } from "../hooks/useDeviceId";
import { useRally } from "../hooks/useRally";

function isEmpty(v: SurveyAnswer | undefined) {
  return v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
}

export default function SurveyPage() {
  const deviceId = useDeviceId();
  const { checkpoints } = useRally();
  const [questions, setQuestions] = useState<SurveyQuestion[] | null>(null);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [answeredBefore, setAnsweredBefore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!deviceId) return;
    let alive = true;
    Promise.all([api.getSurveyQuestions(), api.getSurvey(deviceId)])
      .then(([qs, existing]) => {
        if (!alive) return;
        setQuestions(qs);
        if (existing.answers) {
          setAnswers(existing.answers);
          setAnsweredBefore(true);
        }
      })
      .catch(() => alive && setLoadError("アンケートを読み込めませんでした。通信環境をご確認ください。"));
    return () => {
      alive = false;
    };
  }, [deviceId]);

  const spots = useMemo(() => [...checkpoints].sort((a, b) => a.order - b.order), [checkpoints]);

  const set = (id: string, value: SurveyAnswer | undefined) => {
    setNotice(null);
    setAnswers((prev) => {
      const next = { ...prev };
      if (value === undefined || isEmpty(value)) delete next[id];
      else next[id] = value;
      return next;
    });
  };

  const toggleMulti = (id: string, option: string) => {
    const current = Array.isArray(answers[id]) ? (answers[id] as string[]) : [];
    set(id, current.includes(option) ? current.filter((o) => o !== option) : [...current, option]);
  };

  const submit = async () => {
    if (!questions || saving) return;
    const missing = questions.find((q) => q.required && isEmpty(answers[q.id]));
    if (missing) {
      setNotice({ type: "err", text: `「${missing.label}」は必須です。` });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      await api.submitSurvey(deviceId, answers);
      setAnsweredBefore(true);
      setNotice({ type: "ok", text: "ご回答ありがとうございました。" });
    } catch (e) {
      const text =
        e instanceof ApiError && e.status === 429
          ? "送信回数が多すぎます。しばらく待ってからお試しください。"
          : "送信できませんでした。もう一度お試しください。";
      setNotice({ type: "err", text });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h1 className="display">アンケート</h1>
        <p className="lead" style={{ marginTop: 6 }}>
          今後のスタンプラリー改善のため、ご協力をお願いします。所要時間は1分ほどです。
        </p>
        {answeredBefore && (
          <p className="muted" style={{ marginTop: 6 }}>
            回答済みです。内容を変更して再送信できます。
          </p>
        )}
      </div>

      {loadError && (
        <div className="notice notice--err" role="alert">
          {loadError}
        </div>
      )}

      {!questions && !loadError && (
        <div className="stack" aria-busy="true" aria-label="アンケートを読み込み中">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 110 }} />
          ))}
        </div>
      )}

      {questions?.map((q, idx) => (
        <fieldset key={q.id} className="panel panel--stitch survey-q">
          <legend className="survey-q__label">
            <span className="num survey-q__no">Q{idx + 1}</span>
            {q.label}
            {q.required && <span className="survey-q__req">必須</span>}
          </legend>

          {q.type === "scale" && (
            <div>
              <div className="survey-scale" role="radiogroup" aria-label={q.label}>
                {Array.from({ length: q.max - q.min + 1 }, (_, i) => q.min + i).map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={answers[q.id] === n}
                    className={`survey-scale__btn${answers[q.id] === n ? " is-on" : ""}`}
                    onClick={() => set(q.id, n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="survey-scale__legend muted">
                <span>{q.minLabel}</span>
                <span>{q.maxLabel}</span>
              </div>
            </div>
          )}

          {(q.type === "single" || q.type === "spot") && (
            <div className="survey-options" role="radiogroup" aria-label={q.label}>
              {(q.type === "spot"
                ? spots.map((s) => ({ value: s.id, label: s.name }))
                : q.options.map((o) => ({ value: o, label: o }))
              ).map((opt) => {
                const on = answers[q.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    className={`chip survey-chip${on ? " chip--on" : ""}`}
                    onClick={() => set(q.id, on ? undefined : opt.value)}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "multi" && (
            <div className="survey-options" role="group" aria-label={q.label}>
              {q.options.map((o) => {
                const on = Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={on}
                    className={`chip survey-chip${on ? " chip--on" : ""}`}
                    onClick={() => toggleMulti(q.id, o)}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "text" && (
            <div className="stack">
              <textarea
                className="field"
                rows={4}
                maxLength={q.maxLength}
                aria-label={q.label}
                value={typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""}
                onChange={(e) => set(q.id, e.target.value)}
              />
              <div className="muted" style={{ textAlign: "right" }}>
                {typeof answers[q.id] === "string" ? (answers[q.id] as string).length : 0} / {q.maxLength}
              </div>
            </div>
          )}
        </fieldset>
      ))}

      {questions && (
        <button type="button" className="btn-primary" onClick={submit} disabled={saving}>
          {saving ? "送信中..." : answeredBefore ? "回答を更新する" : "送信する"}
        </button>
      )}

      <div role="status" aria-live="polite">
        {notice && <div className={`notice notice--${notice.type}`}>{notice.text}</div>}
      </div>

      <Link to="/stamps" className="btn-ghost">
        スタンプ一覧へ
      </Link>
    </div>
  );
}
