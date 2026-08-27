// Drizzle schema is not used at runtime (node:sqlite direct).
// This file documents the schema for reference & future PostgreSQL migration.
// See src/db/migrate.ts for actual DDL.
export const schemaDescription = `
users(id TEXT PK, created_at TEXT)
checkpoints(id TEXT PK, name TEXT, description TEXT, "order" INTEGER, qr_code_value TEXT UNIQUE, lat TEXT, lng TEXT, image_url TEXT, created_at TEXT, updated_at TEXT)
stamp_records(id TEXT PK, user_id TEXT FK users, checkpoint_id TEXT FK checkpoints, acquired_at TEXT, UNIQUE(user_id, checkpoint_id))
rally_config(id TEXT PK, title TEXT, updated_at TEXT)
`;
