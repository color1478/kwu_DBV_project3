-- MySQL Workbench에서 이 파일을 먼저 실행하세요!

-- 1단계: 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS ddarungi_db;

-- 2단계: 사용자 생성
CREATE USER IF NOT EXISTS 'ddarungi_user'@'localhost' IDENTIFIED BY 'ddarungi_pass';

-- 3단계: 권한 부여
GRANT ALL PRIVILEGES ON ddarungi_db.* TO 'ddarungi_user'@'localhost';
FLUSH PRIVILEGES;

-- 완료! 이제 01_schema.sql을 실행하세요

