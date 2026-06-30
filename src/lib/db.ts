import "server-only";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// 로컬 개발용 SQLite (better-sqlite3) + Drizzle.
// Cloudflare 배포 시엔 이 파일을 D1 바인딩(drizzle-orm/d1)으로 교체하면 된다.
// 스키마/쿼리는 그대로 재사용 가능.

const DB_PATH = process.env.LOCAL_DB_PATH ?? "./local.db";

// Next.js dev 핫리로드에서 커넥션이 중복 생성되지 않도록 전역 캐시.
const globalForDb = globalThis as unknown as {
  _sqlite?: Database.Database;
};

function createConnection(): Database.Database {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  // 마이그레이션 도구 없이도 첫 실행에 테이블이 생기도록 보장.
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS attendance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE INDEX IF NOT EXISTS idx_logs_user_created
      ON attendance_logs (user_id, created_at);
  `);

  return sqlite;
}

const sqlite = globalForDb._sqlite ?? createConnection();
if (process.env.NODE_ENV !== "production") globalForDb._sqlite = sqlite;

export const db = drizzle(sqlite, { schema });
