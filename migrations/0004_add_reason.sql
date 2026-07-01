-- 예외 사유(외출 사유 / 미출근·결석 사유) 저장용 컬럼 추가.
ALTER TABLE attendance_logs ADD COLUMN reason TEXT;
