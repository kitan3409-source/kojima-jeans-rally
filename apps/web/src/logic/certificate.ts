export type CertificateInput = {
  nickname: string;
  date: Date;
  total: number;
  spots: { name: string; order: number }[];
};

const W = 1080;
const H = 1350;

const FOG = "#e9eef8";
const FOG_SOFT = "#9fb0cf";
const FOG_DIM = "#6b7c9e";
const THREAD = "#e08a35";
const SELVEDGE = "#c8452f";
const INDIGO = "#3b62b0";

const DISPLAY =
  '"Zen Old Mincho", "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';
const BODY =
  '"Zen Kaku Gothic New", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';
const NUM = '"Oswald", "Zen Kaku Gothic New", sans-serif';

function drawBackground(ctx: CanvasRenderingContext2D) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0e1a33");
  bg.addColorStop(0.5, "#0a1122");
  bg.addColorStop(1, "#070b14");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, 260, 60, W / 2, 300, 900);
  glow.addColorStop(0, "rgba(59,98,176,0.34)");
  glow.addColorStop(1, "rgba(59,98,176,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = FOG_SOFT;
  for (let x = -H; x < W; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + H, H);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "#000000";
  for (let x = -H; x < W; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x + 3, 0);
    ctx.lineTo(x + H + 3, H);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFrame(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "rgba(159,176,207,0.55)";
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  ctx.strokeStyle = "rgba(159,176,207,0.28)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(66, 66, W - 132, H - 132);

  ctx.save();
  ctx.setLineDash([14, 10]);
  ctx.strokeStyle = THREAD;
  ctx.lineWidth = 2;
  ctx.strokeRect(84, 84, W - 168, H - 168);
  ctx.restore();
}

function drawTag(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.translate(W / 2, 156);
  ctx.rotate(-0.03);
  const tagW = 320;
  const tagH = 78;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(-tagW / 2 + 6, -tagH / 2 + 7, tagW, tagH);
  ctx.fillStyle = "#e6e0cf";
  ctx.fillRect(-tagW / 2, -tagH / 2, tagW, tagH);
  ctx.fillStyle = SELVEDGE;
  ctx.fillRect(tagW / 2 - 11, -tagH / 2, 11, tagH);
  ctx.fillStyle = "#0a1020";
  ctx.font = `700 42px ${DISPLAY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("児島ジーンズ", -5, 2);
  ctx.restore();
}

function drawHeading(ctx: CanvasRenderingContext2D) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = FOG;
  ctx.font = `700 92px ${DISPLAY}`;
  ctx.fillText("完 成 認 定 証", W / 2, 388);

  ctx.save();
  ctx.setLineDash([12, 10]);
  ctx.strokeStyle = "rgba(224,138,53,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 220, 424);
  ctx.lineTo(W / 2 + 220, 424);
  ctx.stroke();
  ctx.restore();
}

function drawName(ctx: CanvasRenderingContext2D, nickname: string) {
  const name = nickname.trim() || "ゲスト";
  let size = 86;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 ${size}px ${DISPLAY}`;
  while (ctx.measureText(name).width > 720 && size > 36) {
    size -= 4;
    ctx.font = `700 ${size}px ${DISPLAY}`;
  }
  ctx.fillStyle = FOG;
  ctx.fillText(name, W / 2, 574);

  ctx.fillStyle = FOG_SOFT;
  ctx.font = `400 34px ${BODY}`;
  ctx.fillText("さん", W / 2, 632);
}

function drawMeta(ctx: CanvasRenderingContext2D, input: CertificateInput) {
  const y = input.date.getFullYear();
  const m = input.date.getMonth() + 1;
  const d = input.date.getDate();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = THREAD;
  ctx.font = `500 40px ${NUM}`;
  ctx.fillText(`${y}年${m}月${d}日`, W / 2, 714);

  ctx.fillStyle = FOG_SOFT;
  ctx.font = `400 32px ${BODY}`;
  ctx.fillText(`全 ${input.total} スポット制覇`, W / 2, 768);
}

function drawSpots(ctx: CanvasRenderingContext2D, spots: CertificateInput["spots"]) {
  const sorted = [...spots].sort((a, b) => a.order - b.order);
  const n = sorted.length;
  if (n === 0) return;

  const cols = n > 6 ? 2 : 1;
  const rows = Math.ceil(n / cols);
  const areaTop = 842;
  const areaBottom = 1170;
  const rowH = (areaBottom - areaTop) / rows;
  const colW = (W - 240) / cols;

  sorted.forEach((s, i) => {
    const col = Math.floor(i / rows);
    const row = i % rows;
    const x = 120 + col * colW;
    const cy = areaTop + rowH * row + rowH / 2;

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = THREAD;
    ctx.font = `500 28px ${NUM}`;
    ctx.fillText(String(i + 1).padStart(2, "0"), x, cy);

    let size = 28;
    ctx.fillStyle = FOG;
    ctx.font = `400 ${size}px ${BODY}`;
    const maxW = colW - 76;
    while (ctx.measureText(s.name).width > maxW && size > 16) {
      size -= 1;
      ctx.font = `400 ${size}px ${BODY}`;
    }
    ctx.fillText(s.name, x + 58, cy);
  });
}

function drawFooter(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(120, 0, W - 120, 0);
  grad.addColorStop(0, INDIGO);
  grad.addColorStop(0.55, SELVEDGE);
  grad.addColorStop(1, SELVEDGE);
  ctx.fillStyle = grad;
  ctx.fillRect(120, 1204, W - 240, 8);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = FOG_DIM;
  ctx.font = `400 26px ${BODY}`;
  ctx.fillText("児島ジーンズスタンプラリー", W / 2, 1248);
}

async function warmFonts(input: CertificateInput) {
  if (typeof document === "undefined" || !document.fonts) return;
  const y = input.date.getFullYear();
  const m = input.date.getMonth() + 1;
  const d = input.date.getDate();
  const text = [
    "児島ジーンズスタンプラリー",
    "児島ジーンズ",
    "完 成 認 定 証",
    input.nickname.trim() || "ゲスト",
    "さん",
    "0123456789",
    `${y}年${m}月${d}日`,
    `全 ${input.total} スポット制覇`,
    ...input.spots.map((s) => s.name),
  ].join("");
  try {
    await Promise.all([
      document.fonts.load(`700 92px ${DISPLAY}`, text),
      document.fonts.load(`400 34px ${BODY}`, text),
      document.fonts.load(`500 40px ${NUM}`, text),
    ]);
  } catch {
    /* fall back to system fonts */
  }
  await document.fonts.ready;
}

function renderCanvas(input: CertificateInput): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  drawBackground(ctx);
  drawFrame(ctx);
  drawTag(ctx);
  drawHeading(ctx);
  drawName(ctx, input.nickname);
  drawMeta(ctx, input);
  drawSpots(ctx, input.spots);
  drawFooter(ctx);

  return canvas;
}

export async function certificateDataUrl(
  input: CertificateInput
): Promise<string> {
  if (typeof document === "undefined") return "";
  await warmFonts(input);

  const canvas = renderCanvas(input);
  if (!canvas) return "";
  return canvas.toDataURL("image/png");
}

export async function certificateBlobUrl(
  input: CertificateInput
): Promise<string> {
  if (typeof document === "undefined") return "";
  await warmFonts(input);

  const canvas = renderCanvas(input);
  if (!canvas) return "";

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/png");
  });
  if (!blob) throw new Error("failed to encode certificate png");
  return URL.createObjectURL(blob);
}
