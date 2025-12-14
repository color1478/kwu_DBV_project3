-- MySQL Workbench에서 실행할 SQL 스크립트
-- 순서대로 실행하세요

-- 1단계: 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS ddarungi_db;
USE ddarungi_db;

-- 2단계: 사용자 생성 (이미 있다면 오류 무시)
CREATE USER IF NOT EXISTS 'ddarungi_user'@'localhost' IDENTIFIED BY 'ddarungi_pass';

-- 3단계: 권한 부여
GRANT ALL PRIVILEGES ON ddarungi_db.* TO 'ddarungi_user'@'localhost';
FLUSH PRIVILEGES;

-- 완료! 이제 db/init/01_schema.sql과 02_seed.sql을 실행하세요

