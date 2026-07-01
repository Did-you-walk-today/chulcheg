-- 초기 스키마 (기획서 6장)

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

-- 관리자 계정은 단 하나만 존재하도록 DB 레벨에서 강제한다.
-- role='admin' 인 행이 2개 이상이면 이 부분 유니크 인덱스가 막는다.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_single_admin
  ON users (role) WHERE role = 'admin';
