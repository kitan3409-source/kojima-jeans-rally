import { sqlite } from "./index.js";
import { randomUUID } from "node:crypto";
import "./migrate.js";

const now = new Date().toISOString();

const checkpoints = [
  { name: "児島ジーンズストリート", description: "日本初の国産ジーンズ発祥の地。ショップが立ち並ぶメインストリート。", order: 1, qr: "kojima-jeans-street-001", lat: "34.4600", lng: "133.8040" },
  { name: "旧野﨑家住宅", description: "江戸時代の製塩業で栄えた野﨑家の大邸宅。国指定重要文化財。", order: 2, qr: "kojima-nozaki-house-002", lat: "34.4580", lng: "133.8020" },
  { name: "王子が岳", description: "瀬戸内海を一望できる絶景スポット。パラグライダーの聖地としても有名。", order: 3, qr: "kojima-oji-ga-take-003", lat: "34.4700", lng: "133.8100" },
  { name: "児島ボートレース場", description: "瀬戸内海を望むボートレース場。迫力あるレースを間近で観戦できる。", order: 4, qr: "kojima-boat-race-004", lat: "34.4550", lng: "133.8150" },
  { name: "鷲羽山展望台", description: "瀬戸大橋を一望できる展望台。日本の夕陽百選にも選ばれている。", order: 5, qr: "kojima-washuzan-005", lat: "34.4520", lng: "133.8200" },
  { name: "児島駅前広場", description: "児島の玄関口。ジーンズのモニュメントがお出迎え。", order: 6, qr: "kojima-station-006", lat: "34.4620", lng: "133.8000" },
];

for (const cp of checkpoints) {
  const id = randomUUID();
  try {
    sqlite.prepare(`INSERT INTO checkpoints (id, name, description, "order", qr_code_value, lat, lng, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, cp.name, cp.description, cp.order, cp.qr, cp.lat, cp.lng, now, now);
    console.log(`Seeded: ${cp.name} (${cp.qr})`);
  } catch (e: any) {
    if (String(e.message).includes("UNIQUE")) console.log(`Skip (exists): ${cp.name}`);
    else throw e;
  }
}

try {
  sqlite.prepare(`INSERT INTO rally_config (id, title, updated_at) VALUES ('default', '児島ピザスタンプラリー', ?)`).run(now);
} catch { /* exists */ }

console.log("Seed done.");
