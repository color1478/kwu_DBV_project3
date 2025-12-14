-- 데이터베이스 초기화 스크립트
-- MySQL Workbench에서 실행하여 모든 데이터를 삭제하고 다시 시드 데이터를 삽입합니다.

USE ddarungi_db;

-- 외래키 체크 비활성화
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

-- 모든 데이터 삭제 (WHERE 절 추가로 safe update mode 우회)
DELETE FROM likes WHERE like_id > 0;
DELETE FROM comments WHERE comment_id > 0;
DELETE FROM posts WHERE post_id > 0;
DELETE FROM alerts WHERE alert_id > 0;
DELETE FROM user_achievements WHERE user_id > 0;
DELETE FROM achievement_defs WHERE achv_id > 0;
DELETE FROM favorites WHERE fav_id > 0;
DELETE FROM maintenance_orders WHERE order_id > 0;
DELETE FROM fault_reports WHERE report_id > 0;
DELETE FROM rentals WHERE rental_id > 0;
DELETE FROM bikes WHERE bike_id > 0;
DELETE FROM station_baseline WHERE baseline_id > 0;
DELETE FROM station_status WHERE status_id > 0;
DELETE FROM stations WHERE station_id > 0;
DELETE FROM areas WHERE area_id > 0;
DELETE FROM users WHERE user_id > 0;

SET SQL_SAFE_UPDATES = 1;

-- AUTO_INCREMENT 초기화
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE areas AUTO_INCREMENT = 1;
ALTER TABLE stations AUTO_INCREMENT = 1;
ALTER TABLE station_status AUTO_INCREMENT = 1;
ALTER TABLE station_baseline AUTO_INCREMENT = 1;
ALTER TABLE bikes AUTO_INCREMENT = 1;
ALTER TABLE rentals AUTO_INCREMENT = 1;
ALTER TABLE fault_reports AUTO_INCREMENT = 1;
ALTER TABLE maintenance_orders AUTO_INCREMENT = 1;
ALTER TABLE favorites AUTO_INCREMENT = 1;
ALTER TABLE achievement_defs AUTO_INCREMENT = 1;
ALTER TABLE alerts AUTO_INCREMENT = 1;
ALTER TABLE posts AUTO_INCREMENT = 1;
ALTER TABLE comments AUTO_INCREMENT = 1;
ALTER TABLE likes AUTO_INCREMENT = 1;

-- 외래키 체크 활성화
SET FOREIGN_KEY_CHECKS = 1;

-- 이제 02_seed.sql을 실행하세요

