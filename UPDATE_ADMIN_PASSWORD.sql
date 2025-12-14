-- 관리자 계정 비밀번호 업데이트 스크립트
-- 비밀번호: admin123

USE ddarungi_db;

-- 비밀번호 해시 (admin123)
-- 이 해시는 bcrypt로 생성된 실제 해시입니다 (rounds=10)
UPDATE users 
SET password_hash = '$2b$10$ssnJJgHlzy/X2SBnUpa1eeEpBh0G31lZrObIRn3ONZvRqokBHfZie' 
WHERE email = 'admin@ddarungi.com';

SELECT user_id, email, nickname, role FROM users WHERE email = 'admin@ddarungi.com';

