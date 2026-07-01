-- 초기 관리자 계정 시드.
-- 전화번호(=로그인 ID)는 하드코딩된 관리자 번호. 비밀번호는 최초 발급값이며,
-- 로그인 후 /settings 에서 반드시 변경할 것.
-- (비밀번호는 PBKDF2-SHA256 해시로만 저장됨)

INSERT OR IGNORE INTO users (name, phone, password_hash, role)
VALUES (
  '관리자',
  '01021665989',
  'pbkdf2$100000$54a50aa2ffed601232eaf0b25d96aafe$037780bbe55c8192bb86d0c14df4aed2e26699012dc2adce682e50897de117d5',
  'admin'
);
