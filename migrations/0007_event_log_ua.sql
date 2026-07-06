-- 원본 User-Agent 저장 (카카오톡 등 인앱 브라우저 식별용).
ALTER TABLE event_log ADD COLUMN ua TEXT;
