# 児島ピザスタンプラリー 🍕

岡山県倉敷市 児島地域のデジタルスタンプラリーWebアプリ。スマホでQRを読み取ってピザを完成させよう！

## 技術スタック

- フロント: React + Vite + TypeScript + Framer Motion + html5-qrcode + vite-plugin-pwa
- バックエンド: Node.js + Hono + node:sqlite
- DB: SQLite（将来PostgreSQLに移行しやすいスキーマ）

## 必要環境

- Node.js 22+
- pnpm (`npm i -g pnpm`)

## 起動方法

```bash
# 依存インストール
pnpm install

# DB初期化 & シード（6件のチェックポイント）
npx tsx --cwd apps/api src/db/seed.ts

# 開発サーバー起動（2ターミナル）
# ターミナル1: API (http://localhost:3000)
pnpm --filter @kojima/api dev

# ターミナル2: Web (http://localhost:5173)
pnpm --filter @kojima/web dev
```

ブラウザで `http://localhost:5173` を開く。APIは Vite の proxy 経由で `/api/*` → `localhost:3000` に転送される。

## QRコードのテスト方法

### 手入力（最も簡単）

1. `/scan` 画面の「QRの値を手入力」欄に以下いずれかを入力して「獲得」を押す

```
kojima-jeans-street-001
kojima-nozaki-house-002
kojima-oji-ga-take-003
kojima-boat-race-004
kojima-washuzan-005
kojima-station-006
```

### カメラで読み取り

1. 管理画面 (`/admin`, パスワード `kojima2026`) で「QR画像を表示」を押す
2. 別端末/別タブでQR画像を表示し、`/scan` の「カメラを起動」で読み取る
3. `https` または `localhost` でのみカメラが動作します（本番はhttps必須）

### curl で直接テスト

```bash
curl -X POST http://localhost:3000/api/stamps/acquire \
  -H "Content-Type: application/json" \
  -d '{"userId":"my-test-id","qrCodeValue":"kojima-jeans-street-001"}'
```

## 管理画面

- URL: `/admin`
- パスワード: `kojima2026`（環境変数 `ADMIN_TOKEN` で変更可）
- チェックポイントの追加・編集・削除、QR画像の表示が可能
- 件数を変えるとピザの分割数が自動で再計算される

## 将来ネイティブアプリ化する際の移行手順

### Capacitor の場合

```bash
npm i @capacitor/core @capacitor/cli
npx cap init "KojimaPizzaRally" "jp.kojima.pizzarally"
npx cap add ios
npx cap add android
# QR読み取りだけ差し替え:
npm i @capacitor/barcode-scanner
# → apps/web/src/components/QRScanner.tsx を Capacitor BarcodeScanner に置換
# その他のロジック（pizza.ts, api, stores）はそのまま流用
npx cap sync
npx cap open ios / android
```

### React Native (Expo) の場合

1. `apps/native` を新規作成（Expo）
2. `packages/shared` を dependencies に追加して `import { getPizzaSlices, api } from "@kojima/shared"` で流用
3. `QRScanner` は `expo-barcode-scanner` に置換
4. `PizzaStamp` の SVG は `react-native-svg` でそのまま描画可能

### 移行しやすい設計ポイント

- `packages/shared/logic/pizza.ts` — UI非依存の純粋関数。どのプラットフォームでもそのまま使える
- `packages/shared/api` — fetch ラッパー。ベースURLだけ差し替えればOK
- `apps/web/src/components/QRScanner.tsx` — この1ファイルだけをネイティブ用に置換すれば他は流用可能

## ディレクトリ構成

```
packages/shared/  ... 将来ネイティブでも流用する共通ロジック
apps/api/         ... Hono API + SQLite
apps/web/         ... React + Vite PWA
```

## PWA

- `vite-plugin-pwa` で ServiceWorker + manifest を自動生成
- スマホで「ホーム画面に追加」可能
- オフライン時はキャッシュから表示（APIは NetworkFirst）
