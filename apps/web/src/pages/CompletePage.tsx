import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import JeansStamp from "../components/JeansStamp";
import { useRally } from "../hooks/useRally";
import { useProfile } from "../hooks/useProfile";
import { certificateBlobUrl, type CertificateInput } from "../logic/certificate";

const FILE_NAME = "kojima-jeans-certificate.png";
const SHARE_TITLE = "児島ジーンズスタンプラリー";

export default function CompletePage() {
  const { checkpoints, acquiredIds, total, done, isComplete } = useRally();
  const { nickname, ready, error: profileError } = useProfile();

  const [certUrl, setCertUrl] = useState<string | null>(null);
  const [certBusy, setCertBusy] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);
  const [liveMsg, setLiveMsg] = useState<string | null>(null);

  const shareText =
    "児島ジーンズスタンプラリーをコンプリートしました。 #児島ジーンズラリー";

  const buildInput = useCallback(
    (): CertificateInput => ({
      nickname: nickname.trim(),
      date: new Date(),
      total,
      spots: [...checkpoints]
        .sort((a, b) => a.order - b.order)
        .map((c) => ({ name: c.name, order: c.order })),
    }),
    [nickname, total, checkpoints]
  );

  useEffect(() => {
    return () => {
      if (certUrl) URL.revokeObjectURL(certUrl);
    };
  }, [certUrl]);

  const generate = useCallback(async (): Promise<string | null> => {
    setCertBusy(true);
    setCertError(null);
    setLiveMsg(null);
    try {
      const url = await certificateBlobUrl(buildInput());
      if (!url) throw new Error("empty certificate");
      setCertUrl(url);
      setLiveMsg("認定証を生成しました。");
      return url;
    } catch {
      setCertError("認定証の生成に失敗しました。");
      return null;
    } finally {
      setCertBusy(false);
    }
  }, [buildInput]);

  const share = useCallback(async () => {
    let url = certUrl;
    if (!url) url = await generate();
    if (!url) return;

    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], FILE_NAME, { type: "image/png" });
      if (
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: SHARE_TITLE,
          text: shareText,
        });
        setLiveMsg("認定証を共有しました。");
        return;
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
    }

    try {
      if (!navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(shareText);
      setLiveMsg("シェア用のテキストをコピーしました。");
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      alert("共有できませんでした。お使いの環境ではコピーできません。");
    }
  }, [certUrl, generate, shareText]);

  if (!isComplete) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          textAlign: "center",
        }}
      >
        <h1 className="display">まだ染め上がっていません</h1>
        <p className="lead">
          {done} / {total} ピース獲得。残りのスポットを巡りましょう。
        </p>
        <JeansStamp checkpoints={checkpoints} acquiredIds={acquiredIds} />
        <Link to="/scan" className="btn-primary">
          QRコードを読み取る
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ textAlign: "center" }}
      >
        <span className="tag">完成</span>
        <h1 className="display" style={{ marginTop: 12 }}>
          一本、染め上がりました。
        </h1>
        <p className="lead" style={{ marginTop: 8 }}>
          児島を歩ききった証です。おつかれさまでした。
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <JeansStamp checkpoints={checkpoints} acquiredIds={acquiredIds} />
      </motion.div>

      <div className="panel panel--stitch" style={{ textAlign: "center" }}>
        {nickname.trim() ? (
          <>
            <div className="display" style={{ fontSize: 20 }}>
              {nickname}
              <span className="muted" style={{ marginLeft: 6 }}>
                さん
              </span>
            </div>
            <Link
              to="/profile"
              className="muted"
              style={{ display: "inline-block", marginTop: 6 }}
            >
              ニックネームを変更
            </Link>
          </>
        ) : (
          <>
            <p className="muted">ニックネームが未設定です。</p>
            <Link
              to="/profile"
              className="btn-secondary"
              style={{ marginTop: 10 }}
            >
              ニックネームを設定
            </Link>
          </>
        )}
        {profileError && (
          <p className="muted" style={{ marginTop: 8 }}>
            {profileError}
          </p>
        )}
        {!ready && (
          <p className="muted" role="status" aria-live="polite">
            読み込み中...
          </p>
        )}
      </div>

      <div className="panel panel--stitch" style={{ padding: 12 }}>
        {certUrl ? (
          <img
            src={certUrl}
            alt="完成認定証"
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "var(--radius)",
              border: "1px solid var(--line)",
              display: "block",
            }}
          />
        ) : certBusy ? (
          <div
            className="skeleton"
            aria-hidden="true"
            style={{ width: "100%", aspectRatio: "4 / 5" }}
          />
        ) : (
          <div className="stack">
            {certError && (
              <div className="notice notice--err" role="alert">
                {certError}
              </div>
            )}
            <button
              type="button"
              className="btn-primary"
              onClick={generate}
              disabled={certBusy}
            >
              {certError ? "再試行" : "プレビューを表示"}
            </button>
          </div>
        )}
      </div>

      {certBusy && (
        <p className="muted" role="status" aria-live="polite" style={{ textAlign: "center" }}>
          認定証を生成中...
        </p>
      )}

      {liveMsg && (
        <div className="notice notice--ok" role="status" aria-live="polite">
          {liveMsg}
        </div>
      )}

      <div className="stack">
        {certUrl && (
          <a className="btn-primary" href={certUrl} download={FILE_NAME}>
            画像として保存
          </a>
        )}
        <button
          type="button"
          className="btn-secondary"
          onClick={share}
          disabled={certBusy}
        >
          共有する
        </button>
        <Link to="/stamps" className="btn-ghost">
          スタンプ一覧に戻る
        </Link>
      </div>
    </div>
  );
}
