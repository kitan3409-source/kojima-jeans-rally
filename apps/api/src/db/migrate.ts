import { sqlite } from "./index.js";

sqlite.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS checkpoints (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  qr_code_value TEXT NOT NULL UNIQUE,
  lat TEXT,
  lng TEXT,
  image_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS stamp_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  checkpoint_id TEXT NOT NULL REFERENCES checkpoints(id) ON DELETE CASCADE,
  acquired_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_checkpoint ON stamp_records(user_id, checkpoint_id);
CREATE INDEX IF NOT EXISTS idx_stamp_user ON stamp_records(user_id);
CREATE INDEX IF NOT EXISTS idx_stamp_checkpoint ON stamp_records(checkpoint_id);
CREATE INDEX IF NOT EXISTS idx_stamp_acquired ON stamp_records(acquired_at DESC);
CREATE TABLE IF NOT EXISTS rally_config (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '児島ピザスタンプラリー',
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS survey_responses (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  answers TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  nickname TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS accounts (
  login_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`);
console.log("Migration done.");
