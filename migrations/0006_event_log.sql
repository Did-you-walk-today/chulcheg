-- 진단용 이벤트 로그 (로그인/세션 이상 + 기기 정보).
CREATE TABLE IF NOT EXISTS event_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  level TEXT NOT NULL,
  event TEXT NOT NULL,
  message TEXT,
  path TEXT,
  status INTEGER,
  host TEXT,
  ip TEXT,
  country TEXT,
  isp TEXT,
  browser TEXT,
  browser_ver TEXT,
  os TEXT,
  os_ver TEXT,
  is_mobile INTEGER,
  had_sid INTEGER,
  user_id INTEGER
);
CREATE INDEX IF NOT EXISTS idx_event_log_created ON event_log (created_at);
