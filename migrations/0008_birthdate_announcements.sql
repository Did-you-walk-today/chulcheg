-- 생일 수집 팝업 + 공지 팝업 기능.
-- birthdate: 학생 생년월일(YYYY-MM-DD 문자열). 미입력 시 null → 로그인 때 팝업.
-- seen_announcement_id: 이 사용자가 확인한 마지막 공지 id. 최신 공지 id 가 이보다 크면 팝업.
ALTER TABLE users ADD COLUMN birthdate TEXT;
ALTER TABLE users ADD COLUMN seen_announcement_id INTEGER NOT NULL DEFAULT 0;

-- 공지. admin 이 작성하면 모든 학생에게 팝업으로 1회 노출된다.
CREATE TABLE announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
