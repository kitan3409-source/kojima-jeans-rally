import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const dbPath = process.env.DATABASE_URL ?? path.resolve("data/rally.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const sqlite = new DatabaseSync(dbPath);
sqlite.exec(`PRAGMA journal_mode = WAL`);
sqlite.exec(`PRAGMA foreign_keys = ON`);
