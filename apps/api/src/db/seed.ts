import { sqlite } from "./index.js";
import { randomBytes, randomUUID } from "node:crypto";
import { isProduction } from "../config.js";
import "./migrate.js";

const now = new Date().toISOString();

const checkpoints = [
  { name: "味野商店街", description: "昔ながらの雰囲気が残る味野商店街も散策に適しています。理由の一つ目は、地元の日常が感じられることです。二つ目は、小さな飲食店や個人商店との出会いです。三つ目は、レトロな看板や街並みが写真に味わいを加えることです。通りを奥行きある構図で撮影すると、素朴な町の魅力が表現できます。", order: 1, qr: "kojima-ajino-shotengai-001", lat: "34.4685", lng: "133.8020" },
  { name: "児島ジーンズストリート", description: "初めて児島を訪れるなら、まず歩きたいのが児島ジーンズストリートです。児島は「国産ジーンズ発祥の地」として知られ、繊維産業の歴史を背景にデニム文化が根付いた町です。この通りには地元ブランドの直営店や工房が並び、職人のこだわりが詰まった一本と出会えます。理由の一つ目は、児島らしさを最も体感できる場所であることです。二つ目は、店ごとに個性があり、加工や縫製の違いを見比べる楽しさがあることです。三つ目は、通りの上に吊るされたデニムの装飾が写真映えする点です。青空の下で揺れるデニムを見上げて撮影すると、児島らしい一枚になります。", order: 2, qr: "kojima-jeans-street-002", lat: "34.4690", lng: "133.8024" },
  { name: "旧野﨑家住宅", description: "児島の歴史を知るなら旧野﨑家住宅がおすすめです。塩田王と呼ばれた野﨑家の邸宅で、広大な敷地と重厚な建物が当時の繁栄を伝えます。理由の一つ目は、江戸から明治期の商家建築を体感できることです。二つ目は、庭園の美しさです。三つ目は、児島が塩田で栄えた歴史を学べる点です。庭園越しに母屋を撮影すると、落ち着いた雰囲気の写真になります。", order: 3, qr: "kojima-nozaki-house-003", lat: "34.4720", lng: "133.8030" },
  { name: "児島学生服資料館", description: "児島はデニムだけでなく学生服の生産地としても有名です。児島学生服資料館では、その歴史や製造工程を学べます。理由の一つ目は、繊維の町としての多面的な姿を知れることです。二つ目は、実物展示の迫力です。三つ目は、ものづくりの町としての誇りを感じられる点です。展示品を背景に撮影すると、児島の産業文化を伝える写真になります。", order: 4, qr: "kojima-school-uniform-museum-004", lat: "34.4770", lng: "133.8240" },
  { name: "ベティスミスミュージアム", description: "国産ジーンズの歴史や貴重なヴィンテージ資料を気軽に学べます。敷地内には日本最古のジーンズ縫製工場があり、実際の製造工程を窓越しに見学できます。パーツ（ボタンやリベット等）を選んで自分だけのオリジナルジーンズを作るジーンズ作り体験ができます。世界に1本だけのジーンズが作れるオーダージーンズサロンや、限定アイテムが買えるショップ、アウトレットが揃っています。", order: 5, qr: "kojima-betty-smith-museum-005", lat: "34.4768", lng: "133.8229" },
  { name: "鷲羽山ハイランド", description: "瀬戸内海の絶景とブラジル文化、そしてスリル満点の絶叫マシンが融合したユニークな遊園地。地上16m（標高は約150m〜200mの斜面）の高さを自力でペダルを漕いで進む名物アトラクションで、足元むき出しのスリルと瀬戸大橋・瀬戸内海の絶景を同時に味わえます。立ったまま乗る「スタンディングコースター」や、垂直落下や回転が特徴の「ウルトラツイスター」、本格的な「バンジージャンプ」など、スリルを追求したマシンがそろっています。瀬戸内国立公園内（下津井鷲羽山）の山上に位置し、園内の各所や大観覧車から美しい多島美や瀬戸大橋を一望できます。また、お好み焼きが美味しいです。", order: 6, qr: "kojima-washuzan-highland-006", lat: "34.4464", lng: "133.7982" },
];

for (const cp of checkpoints) {
  const id = randomUUID();
  const qr = isProduction ? `${cp.qr}-${randomBytes(12).toString("hex")}` : cp.qr;
  try {
    sqlite.prepare(`INSERT INTO checkpoints (id, name, description, "order", qr_code_value, lat, lng, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, cp.name, cp.description, cp.order, qr, cp.lat, cp.lng, now, now);
    console.log(`Seeded: ${cp.name}`);
  } catch (e: any) {
    if (String(e.message).includes("UNIQUE")) console.log(`Skip (exists): ${cp.name}`);
    else throw e;
  }
}

try {
  sqlite.prepare(`INSERT INTO rally_config (id, title, updated_at) VALUES ('default', '児島ピザスタンプラリー', ?)`).run(now);
} catch { /* exists */ }

console.log("Seed done.");
