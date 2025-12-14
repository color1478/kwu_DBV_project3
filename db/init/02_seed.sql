-- Seed data for SD (Ddarungi) Insight

-- 데이터베이스 선택 (중요!)
USE ddarungi_db;

-- 기존 데이터 삭제 (중복 실행 방지)
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

-- 외래 키 제약이 있는 테이블부터 삭제 (역순)
DELETE FROM likes;
DELETE FROM comments;
DELETE FROM posts;
DELETE FROM alerts;
DELETE FROM user_achievements;
DELETE FROM achievement_defs;
DELETE FROM favorites;
DELETE FROM maintenance_orders;
DELETE FROM fault_reports;
DELETE FROM rentals;
DELETE FROM bikes;
DELETE FROM station_baseline;
DELETE FROM station_status;
DELETE FROM stations;
DELETE FROM areas;
DELETE FROM users;

SET SQL_SAFE_UPDATES = 1;
SET FOREIGN_KEY_CHECKS = 1;

-- AUTO_INCREMENT 리셋 (중복 키 오류 방지)
-- TRUNCATE를 사용하면 AUTO_INCREMENT가 자동으로 리셋됨
-- 하지만 DELETE를 사용했으므로 명시적으로 리셋 필요
SET FOREIGN_KEY_CHECKS = 0;
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
ALTER TABLE user_achievements AUTO_INCREMENT = 1;
ALTER TABLE alerts AUTO_INCREMENT = 1;
ALTER TABLE posts AUTO_INCREMENT = 1;
ALTER TABLE comments AUTO_INCREMENT = 1;
ALTER TABLE likes AUTO_INCREMENT = 1;
SET FOREIGN_KEY_CHECKS = 1;

-- Insert areas (Seoul districts)
INSERT INTO areas (area_id, area_name) VALUES
(1, '강남구'),
(2, '서초구'),
(3, '송파구'),
(4, '마포구'),
(5, '종로구');

-- Insert users
-- Password: password123 (hashed with bcrypt, rounds=10)
-- Admin: admin@ddarungi.com / password123
-- Users: user1@ddarungi.com / password123, user2@ddarungi.com / password123
INSERT INTO users (user_id, email, password_hash, nickname, role, is_active) VALUES
(1, 'admin@ddarungi.com', '$2b$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', '관리자', 'ADMIN', TRUE),
(2, 'user1@ddarungi.com', '$2b$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJq', '사용자1', 'USER', TRUE),
(3, 'user2@ddarungi.com', '$2b$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJq', '사용자2', 'USER', TRUE);

-- Insert stations (30 stations around Seoul)
INSERT INTO stations (station_id, area_id, station_name, latitude, longitude, docks_total, is_active) VALUES
(1, 1, '강남역 1번 출구', 37.4980, 127.0276, 20, TRUE),
(2, 1, '강남역 2번 출구', 37.4990, 127.0286, 15, TRUE),
(3, 1, '역삼역', 37.5000, 37.5000, 18, TRUE),
(4, 1, '선릉역', 37.5045, 127.0489, 22, TRUE),
(5, 1, '삼성역', 37.5088, 127.0630, 20, TRUE),
(6, 2, '서초역', 37.4837, 127.0324, 16, TRUE),
(7, 2, '교대역', 37.4934, 127.0146, 19, TRUE),
(8, 2, '방배역', 37.4814, 126.9975, 17, TRUE),
(9, 2, '사당역', 37.4765, 126.9816, 21, TRUE),
(10, 2, '낙성대역', 37.4767, 126.9639, 18, TRUE),
(11, 3, '잠실역', 37.5133, 127.1028, 25, TRUE),
(12, 3, '문정역', 37.4856, 127.1225, 20, TRUE),
(13, 3, '가락시장역', 37.4929, 127.1188, 19, TRUE),
(14, 3, '석촌역', 37.5054, 127.1069, 18, TRUE),
(15, 3, '송파역', 37.4997, 127.1121, 22, TRUE),
(16, 4, '홍대입구역', 37.5569, 126.9230, 24, TRUE),
(17, 4, '합정역', 37.5495, 126.9139, 20, TRUE),
(18, 4, '상수역', 37.5477, 126.9225, 17, TRUE),
(19, 4, '마포구청역', 37.5660, 126.9014, 19, TRUE),
(20, 4, '공덕역', 37.5446, 126.9513, 21, TRUE),
(21, 5, '종로3가역', 37.5710, 126.9918, 23, TRUE),
(22, 5, '을지로입구역', 37.5661, 126.9827, 20, TRUE),
(23, 5, '광화문역', 37.5714, 126.9768, 22, TRUE),
(24, 5, '안국역', 37.5765, 126.9854, 18, TRUE),
(25, 5, '경복궁역', 37.5760, 126.9730, 19, TRUE),
(26, 1, '봉은사역', 37.5142, 127.0475, 16, TRUE),
(27, 1, '삼성중앙역', 37.5133, 127.0475, 17, TRUE),
(28, 2, '반포역', 37.5081, 127.0116, 18, TRUE),
(29, 3, '올림픽공원역', 37.5163, 127.1308, 20, TRUE),
(30, 4, '이대앞역', 37.5567, 126.9450, 19, TRUE);

-- Insert station status snapshots (3 timestamps)
-- 29개 대여소 분포: 부족 10개, 보통 5개, 양호 5개, 여유 4개 (총 24개, 나머지 5개는 기본값)
-- baseline_demand = 10 기준
INSERT INTO station_status (station_id, snapshot_ts, bikes_available, docks_available) VALUES
-- Snapshot 1: 2024-01-15 08:00:00
-- 부족 (10개): load_factor < 0.5 → bikes_available < 5
(1, '2024-01-15 08:00:00', 2, 18),  -- 부족: 2대 (부하율 0.2)
(2, '2024-01-15 08:00:00', 1, 14),  -- 부족: 1대 (부하율 0.1)
(3, '2024-01-15 08:00:00', 3, 15),  -- 부족: 3대 (부하율 0.3)
(4, '2024-01-15 08:00:00', 4, 16),  -- 부족: 4대 (부하율 0.4)
(5, '2024-01-15 08:00:00', 2, 18),  -- 부족: 2대 (부하율 0.2)
(6, '2024-01-15 08:00:00', 1, 15),  -- 부족: 1대 (부하율 0.1)
(7, '2024-01-15 08:00:00', 3, 16),  -- 부족: 3대 (부하율 0.3)
(8, '2024-01-15 08:00:00', 4, 13),  -- 부족: 4대 (부하율 0.4)
(9, '2024-01-15 08:00:00', 2, 19),  -- 부족: 2대 (부하율 0.2)
(10, '2024-01-15 08:00:00', 3, 15),  -- 부족: 3대 (부하율 0.3)
-- 보통 (5개): 0.5 <= load_factor < 0.8 → 5 <= bikes_available < 8
(11, '2024-01-15 08:00:00', 5, 20),  -- 보통: 5대 (부하율 0.5)
(12, '2024-01-15 08:00:00', 6, 14),  -- 보통: 6대 (부하율 0.6)
(13, '2024-01-15 08:00:00', 7, 12),  -- 보통: 7대 (부하율 0.7)
(14, '2024-01-15 08:00:00', 5, 13),  -- 보통: 5대 (부하율 0.5)
(15, '2024-01-15 08:00:00', 6, 12),  -- 보통: 6대 (부하율 0.6)
-- 양호 (5개): 0.8 <= load_factor <= 1.2 → 8 <= bikes_available <= 12
(16, '2024-01-15 08:00:00', 8, 12),  -- 양호: 8대 (부하율 0.8)
(17, '2024-01-15 08:00:00', 9, 9),   -- 양호: 9대 (부하율 0.9)
(18, '2024-01-15 08:00:00', 10, 10), -- 양호: 10대 (부하율 1.0)
(19, '2024-01-15 08:00:00', 11, 8),  -- 양호: 11대 (부하율 1.1)
(20, '2024-01-15 08:00:00', 12, 8),  -- 양호: 12대 (부하율 1.2)
-- 여유 (4개): load_factor > 1.2 → bikes_available > 12
(21, '2024-01-15 08:00:00', 13, 10), -- 여유: 13대 (부하율 1.3)
(22, '2024-01-15 08:00:00', 14, 9),  -- 여유: 14대 (부하율 1.4)
(23, '2024-01-15 08:00:00', 15, 8),  -- 여유: 15대 (부하율 1.5)
(24, '2024-01-15 08:00:00', 16, 7),  -- 여유: 16대 (부하율 1.6)
-- 나머지 5개 (기본값 - 양호 상태)
(25, '2024-01-15 08:00:00', 10, 10), -- 양호: 10대 (부하율 1.0)
(26, '2024-01-15 08:00:00', 9, 9),   -- 양호: 9대 (부하율 0.9)
(27, '2024-01-15 08:00:00', 11, 8),  -- 양호: 11대 (부하율 1.1)
(28, '2024-01-15 08:00:00', 10, 8),  -- 양호: 10대 (부하율 1.0)
(29, '2024-01-15 08:00:00', 8, 11),  -- 양호: 8대 (부하율 0.8)
(30, '2024-01-15 08:00:00', 10, 9),  -- 양호: 10대 (부하율 1.0)
-- Snapshot 2: 2024-01-15 12:00:00
(1, '2024-01-15 12:00:00', 10, 10),
(2, '2024-01-15 12:00:00', 8, 7),
(3, '2024-01-15 12:00:00', 12, 6),
(4, '2024-01-15 12:00:00', 15, 7),
(5, '2024-01-15 12:00:00', 11, 9),
(6, '2024-01-15 12:00:00', 9, 7),
(7, '2024-01-15 12:00:00', 13, 6),
(8, '2024-01-15 12:00:00', 10, 7),
(9, '2024-01-15 12:00:00', 14, 7),
(10, '2024-01-15 12:00:00', 8, 10),
(11, '2024-01-15 12:00:00', 18, 7),
(12, '2024-01-15 12:00:00', 12, 8),
(13, '2024-01-15 12:00:00', 11, 8),
(14, '2024-01-15 12:00:00', 13, 5),
(15, '2024-01-15 12:00:00', 16, 6),
(16, '2024-01-15 12:00:00', 19, 5),
(17, '2024-01-15 12:00:00', 14, 6),
(18, '2024-01-15 12:00:00', 10, 7),
(19, '2024-01-15 12:00:00', 12, 7),
(20, '2024-01-15 12:00:00', 15, 6),
(21, '2024-01-15 12:00:00', 17, 6),
(22, '2024-01-15 12:00:00', 13, 7),
(23, '2024-01-15 12:00:00', 16, 6),
(24, '2024-01-15 12:00:00', 10, 8),
(25, '2024-01-15 12:00:00', 11, 8),
(26, '2024-01-15 12:00:00', 8, 8),
(27, '2024-01-15 12:00:00', 9, 8),
(28, '2024-01-15 12:00:00', 12, 6),
(29, '2024-01-15 12:00:00', 13, 7),
(30, '2024-01-15 12:00:00', 14, 5),  -- 이대앞역: 14대 대여 가능
-- Snapshot 3: 2024-01-15 18:00:00
(1, '2024-01-15 18:00:00', 15, 5),
(2, '2024-01-15 18:00:00', 12, 3),
(3, '2024-01-15 18:00:00', 16, 2),
(4, '2024-01-15 18:00:00', 19, 3),
(5, '2024-01-15 18:00:00', 14, 6),
(6, '2024-01-15 18:00:00', 12, 4),
(7, '2024-01-15 18:00:00', 17, 2),
(8, '2024-01-15 18:00:00', 13, 4),
(9, '2024-01-15 18:00:00', 18, 3),
(10, '2024-01-15 18:00:00', 11, 7),
(11, '2024-01-15 18:00:00', 22, 3),
(12, '2024-01-15 18:00:00', 16, 4),
(13, '2024-01-15 18:00:00', 15, 4),
(14, '2024-01-15 18:00:00', 17, 1),
(15, '2024-01-15 18:00:00', 20, 2),
(16, '2024-01-15 18:00:00', 23, 1),
(17, '2024-01-15 18:00:00', 18, 2),
(18, '2024-01-15 18:00:00', 14, 3),
(19, '2024-01-15 18:00:00', 16, 3),
(20, '2024-01-15 18:00:00', 19, 2),
(21, '2024-01-15 18:00:00', 21, 2),
(22, '2024-01-15 18:00:00', 17, 3),
(23, '2024-01-15 18:00:00', 20, 2),
(24, '2024-01-15 18:00:00', 13, 5),
(25, '2024-01-15 18:00:00', 14, 5),
(26, '2024-01-15 18:00:00', 11, 5),
(27, '2024-01-15 18:00:00', 12, 5),
(28, '2024-01-15 18:00:00', 15, 3),
(29, '2024-01-15 18:00:00', 16, 4),
(30, '2024-01-15 18:00:00', 14, 5);

-- Insert station baseline (모든 요일과 시간대에 대해 다양한 부하율 생성)
-- 현재 시간대(오늘 요일/시간)에 맞춰 부족/보통/양호/여유 모든 경우가 나오도록 설정
-- 예: 오늘이 월요일이고 현재 시간이 12시라면, 월요일 12시 baseline을 설정

-- 모든 요일(0-6)과 시간(0-23)에 대해 baseline 생성
-- 부하율이 다양하게 나오도록: 부족(<0.5), 보통(0.5-0.8), 양호(0.8-1.2), 여유(>1.2)

-- 월요일(1) - Hour 8 (모든 baseline을 10으로 통일, station_status의 bikes_available로 부하율 조정)
INSERT INTO station_baseline (station_id, dow, hour, baseline_demand, samples) VALUES
-- 모든 대여소의 baseline을 10으로 통일
(1, 1, 8, 10.0, 20),  -- bikes: 2 -> 0.2 (부족)
(2, 1, 8, 10.0, 18),  -- bikes: 1 -> 0.1 (부족)
(3, 1, 8, 10.0, 20),  -- bikes: 3 -> 0.3 (부족)
(4, 1, 8, 10.0, 20),  -- bikes: 4 -> 0.4 (부족)
(5, 1, 8, 10.0, 20),  -- bikes: 2 -> 0.2 (부족)
(6, 1, 8, 10.0, 18),  -- bikes: 2 -> 0.2 (부족)
(7, 1, 8, 10.0, 20),  -- bikes: 3 -> 0.3 (부족)
(8, 1, 8, 10.0, 20),  -- bikes: 4 -> 0.4 (부족)
(9, 1, 8, 10.0, 20),  -- bikes: 11 -> 1.1 (양호)
(10, 1, 8, 10.0, 19), -- bikes: 2 -> 0.2 (부족)
(11, 1, 8, 10.0, 20), -- bikes: 15 -> 1.5 (여유)
(12, 1, 8, 10.0, 20), -- bikes: 6 -> 0.6 (보통)
(13, 1, 8, 10.0, 20), -- bikes: 7 -> 0.7 (보통)
(14, 1, 8, 10.0, 20), -- bikes: 9 -> 0.9 (양호)
(15, 1, 8, 10.0, 20), -- bikes: 12 -> 1.2 (양호)
(16, 1, 8, 10.0, 20), -- bikes: 14 -> 1.4 (여유)
(17, 1, 8, 10.0, 20), -- bikes: 10 -> 1.0 (양호)
(18, 1, 8, 10.0, 20), -- bikes: 3 -> 0.3 (부족)
(19, 1, 8, 10.0, 20), -- bikes: 4 -> 0.4 (부족)
(20, 1, 8, 10.0, 20), -- bikes: 11 -> 1.1 (양호)
(21, 1, 8, 10.0, 20), -- bikes: 13 -> 1.3 (여유)
(22, 1, 8, 10.0, 20), -- bikes: 6 -> 0.6 (보통)
(23, 1, 8, 10.0, 20), -- bikes: 12 -> 1.2 (양호)
(24, 1, 8, 10.0, 20), -- bikes: 3 -> 0.3 (부족)
(25, 1, 8, 10.0, 20), -- bikes: 7 -> 0.7 (보통)
(26, 1, 8, 10.0, 20), -- bikes: 1 -> 0.1 (부족)
(27, 1, 8, 10.0, 20), -- bikes: 4 -> 0.4 (부족)
(28, 1, 8, 10.0, 20), -- bikes: 9 -> 0.9 (양호)
(29, 1, 8, 10.0, 20), -- bikes: 10 -> 1.0 (양호)
(30, 1, 8, 10.0, 20); -- bikes: 5 -> 0.5 (보통)

-- 다양한 시간대 baseline 추가 (0, 6, 9, 12, 15, 18, 21시)
-- Hour 0 (자정)
INSERT INTO station_baseline (station_id, dow, hour, baseline_demand, samples) VALUES
(1, 1, 0, 8.0, 15), (2, 1, 0, 7.0, 12), (3, 1, 0, 9.0, 18), (4, 1, 0, 8.0, 16),
(5, 1, 0, 7.0, 14), (6, 1, 0, 9.0, 17), (7, 1, 0, 8.0, 15), (8, 1, 0, 7.0, 13),
(9, 1, 0, 10.0, 20), (10, 1, 0, 8.0, 16), (11, 1, 0, 12.0, 25), (12, 1, 0, 9.0, 18),
(13, 1, 0, 8.0, 16), (14, 1, 0, 10.0, 20), (15, 1, 0, 11.0, 22), (16, 1, 0, 13.0, 26),
(17, 1, 0, 10.0, 20), (18, 1, 0, 8.0, 16), (19, 1, 0, 9.0, 18), (20, 1, 0, 11.0, 22),
(21, 1, 0, 12.0, 24), (22, 1, 0, 9.0, 18), (23, 1, 0, 11.0, 22), (24, 1, 0, 8.0, 16),
(25, 1, 0, 9.0, 18), (26, 1, 0, 7.0, 14), (27, 1, 0, 8.0, 16), (28, 1, 0, 10.0, 20),
(29, 1, 0, 10.0, 20), (30, 1, 0, 9.0, 18);

-- Hour 6 (새벽)
INSERT INTO station_baseline (station_id, dow, hour, baseline_demand, samples) VALUES
(1, 1, 6, 9.0, 18), (2, 1, 6, 8.0, 16), (3, 1, 6, 10.0, 20), (4, 1, 6, 9.0, 18),
(5, 1, 6, 8.0, 16), (6, 1, 6, 10.0, 20), (7, 1, 6, 9.0, 18), (8, 1, 6, 8.0, 16),
(9, 1, 6, 11.0, 22), (10, 1, 6, 9.0, 18), (11, 1, 6, 13.0, 26), (12, 1, 6, 10.0, 20),
(13, 1, 6, 9.0, 18), (14, 1, 6, 11.0, 22), (15, 1, 6, 12.0, 24), (16, 1, 6, 14.0, 28),
(17, 1, 6, 11.0, 22), (18, 1, 6, 9.0, 18), (19, 1, 6, 10.0, 20), (20, 1, 6, 12.0, 24),
(21, 1, 6, 13.0, 26), (22, 1, 6, 10.0, 20), (23, 1, 6, 12.0, 24), (24, 1, 6, 9.0, 18),
(25, 1, 6, 10.0, 20), (26, 1, 6, 8.0, 16), (27, 1, 6, 9.0, 18), (28, 1, 6, 11.0, 22),
(29, 1, 6, 11.0, 22), (30, 1, 6, 10.0, 20);

-- Hour 9 (오전)
INSERT INTO station_baseline (station_id, dow, hour, baseline_demand, samples) VALUES
(1, 1, 9, 11.0, 22), (2, 1, 9, 10.0, 20), (3, 1, 9, 12.0, 24), (4, 1, 9, 11.0, 22),
(5, 1, 9, 10.0, 20), (6, 1, 9, 12.0, 24), (7, 1, 9, 11.0, 22), (8, 1, 9, 10.0, 20),
(9, 1, 9, 13.0, 26), (10, 1, 9, 11.0, 22), (11, 1, 9, 15.0, 30), (12, 1, 9, 12.0, 24),
(13, 1, 9, 11.0, 22), (14, 1, 9, 13.0, 26), (15, 1, 9, 14.0, 28), (16, 1, 9, 16.0, 32),
(17, 1, 9, 13.0, 26), (18, 1, 9, 11.0, 22), (19, 1, 9, 12.0, 24), (20, 1, 9, 14.0, 28),
(21, 1, 9, 15.0, 30), (22, 1, 9, 12.0, 24), (23, 1, 9, 14.0, 28), (24, 1, 9, 11.0, 22),
(25, 1, 9, 12.0, 24), (26, 1, 9, 10.0, 20), (27, 1, 9, 11.0, 22), (28, 1, 9, 13.0, 26),
(29, 1, 9, 13.0, 26), (30, 1, 9, 12.0, 24);

-- Hour 12 (정오) - 기존 데이터 유지
INSERT INTO station_baseline (station_id, dow, hour, baseline_demand, samples) VALUES
-- Hour 12 - 다양한 부하율
(1, 1, 12, 15.0, 25),  -- bikes: 10, baseline: 15 -> 0.67 (보통)
(2, 1, 12, 12.0, 22),  -- bikes: 8, baseline: 12 -> 0.67 (보통)
(3, 1, 12, 10.0, 28),  -- bikes: 12, baseline: 10 -> 1.2 (양호)
(4, 1, 12, 12.0, 30),  -- bikes: 15, baseline: 12 -> 1.25 (여유)
(5, 1, 12, 14.0, 26),  -- bikes: 11, baseline: 14 -> 0.79 (보통),
(6, 1, 12, 20.0, 22),  -- bikes: 9, baseline: 20 -> 0.45 (부족)
(7, 1, 12, 11.0, 28),  -- bikes: 13, baseline: 11 -> 1.18 (양호)
(8, 1, 12, 15.0, 24),  -- bikes: 10, baseline: 15 -> 0.67 (보통)
(9, 1, 12, 12.0, 30),  -- bikes: 14, baseline: 12 -> 1.17 (양호)
(10, 1, 12, 18.0, 25), -- bikes: 8, baseline: 18 -> 0.44 (부족),
(11, 1, 12, 15.0, 35), -- bikes: 18, baseline: 15 -> 1.2 (양호)
(12, 1, 12, 10.0, 28), -- bikes: 12, baseline: 10 -> 1.2 (양호)
(13, 1, 12, 14.0, 28), -- bikes: 11, baseline: 14 -> 0.79 (보통)
(14, 1, 12, 11.0, 30), -- bikes: 13, baseline: 11 -> 1.18 (양호)
(15, 1, 12, 13.0, 32), -- bikes: 16, baseline: 13 -> 1.23 (여유)
(16, 1, 12, 16.0, 38), -- bikes: 19, baseline: 16 -> 1.19 (양호)
(17, 1, 12, 12.0, 30), -- bikes: 14, baseline: 12 -> 1.17 (양호)
(18, 1, 12, 14.0, 24), -- bikes: 10, baseline: 14 -> 0.71 (보통)
(19, 1, 12, 15.0, 28), -- bikes: 12, baseline: 15 -> 0.8 (양호)
(20, 1, 12, 13.0, 32), -- bikes: 15, baseline: 13 -> 1.15 (양호)
(21, 1, 12, 14.0, 35), -- bikes: 17, baseline: 14 -> 1.21 (여유)
(22, 1, 12, 11.0, 30), -- bikes: 13, baseline: 11 -> 1.18 (양호)
(23, 1, 12, 13.0, 34), -- bikes: 16, baseline: 13 -> 1.23 (여유)
(24, 1, 12, 12.0, 26), -- bikes: 10, baseline: 12 -> 0.83 (보통)
(25, 1, 12, 13.0, 28), -- bikes: 11, baseline: 13 -> 0.85 (보통)
(26, 1, 12, 18.0, 24), -- bikes: 8, baseline: 18 -> 0.44 (부족)
(27, 1, 12, 16.0, 26), -- bikes: 9, baseline: 16 -> 0.56 (보통)
(28, 1, 12, 10.0, 28), -- bikes: 12, baseline: 10 -> 1.2 (양호)
(29, 1, 12, 11.0, 32), -- bikes: 13, baseline: 11 -> 1.18 (양호)
(30, 1, 12, 13.0, 28); -- bikes: 11, baseline: 13 -> 0.85 (보통)

-- 모든 시간대(0-23시)에 baseline 추가 (없는 시간대는 기본값 10)
-- 각 대여소에 대해 0-23시 모두 생성
INSERT INTO station_baseline (station_id, dow, hour, baseline_demand, samples)
SELECT DISTINCT station_id, 1 as dow, hour_num as hour, 10.0 as baseline_demand, 20 as samples
FROM (
  SELECT station_id FROM stations WHERE is_active = TRUE
) s
CROSS JOIN (
  SELECT 0 as hour_num UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
  SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION
  SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION
  SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23
) hours
WHERE NOT EXISTS (
  SELECT 1 FROM station_baseline sb 
  WHERE sb.station_id = s.station_id AND sb.dow = 1 AND sb.hour = hours.hour_num
);

-- 모든 요일(0-6)에 대해 월요일(1) 데이터 복사
INSERT INTO station_baseline (station_id, dow, hour, baseline_demand, samples)
SELECT station_id, 0 as dow, hour, baseline_demand, samples FROM station_baseline WHERE dow = 1;

INSERT INTO station_baseline (station_id, dow, hour, baseline_demand, samples)
SELECT station_id, 2 as dow, hour, baseline_demand, samples FROM station_baseline WHERE dow = 1;

INSERT INTO station_baseline (station_id, dow, hour, baseline_demand, samples)
SELECT station_id, 3 as dow, hour, baseline_demand, samples FROM station_baseline WHERE dow = 1;

INSERT INTO station_baseline (station_id, dow, hour, baseline_demand, samples)
SELECT station_id, 4 as dow, hour, baseline_demand, samples FROM station_baseline WHERE dow = 1;

INSERT INTO station_baseline (station_id, dow, hour, baseline_demand, samples)
SELECT station_id, 5 as dow, hour, baseline_demand, samples FROM station_baseline WHERE dow = 1;

INSERT INTO station_baseline (station_id, dow, hour, baseline_demand, samples)
SELECT station_id, 6 as dow, hour, baseline_demand, samples FROM station_baseline WHERE dow = 1;

-- Insert bikes (각 대여소의 bikes_available 수에 맞게 배치)
-- station_status의 첫 번째 스냅샷(08:00:00) 기준으로 bikes_available 수와 일치시킴
INSERT INTO bikes (bike_id, station_id, status, purchased_at) VALUES
-- 부족 (10개): Station 1-10
-- Station 1: bikes_available = 2
(1, 1, 'AVAILABLE', '2023-01-15'),
(2, 1, 'AVAILABLE', '2023-02-20'),
(3, 1, 'IN_USE', '2023-03-10'),
(4, 1, 'IN_USE', '2023-01-25'),
(5, 1, 'IN_USE', '2023-04-05'),
-- Station 2: bikes_available = 1
(6, 2, 'AVAILABLE', '2023-02-15'),
(7, 2, 'IN_USE', '2023-03-20'),
(8, 2, 'IN_USE', '2023-04-10'),
(9, 2, 'IN_USE', '2023-05-01'),
(10, 2, 'IN_USE', '2023-05-15'),
-- Station 3: bikes_available = 3
(11, 3, 'AVAILABLE', '2023-01-20'),
(12, 3, 'AVAILABLE', '2023-02-28'),
(13, 3, 'AVAILABLE', '2023-03-15'),
(14, 3, 'IN_USE', '2023-04-20'),
(15, 3, 'IN_USE', '2023-05-10'),
-- Station 4: bikes_available = 4
(16, 4, 'AVAILABLE', '2023-01-10'),
(17, 4, 'AVAILABLE', '2023-02-20'),
(18, 4, 'AVAILABLE', '2023-03-10'),
(19, 4, 'AVAILABLE', '2023-04-05'),
(20, 4, 'IN_USE', '2023-05-01'),
-- Station 5: bikes_available = 2
(21, 5, 'AVAILABLE', '2023-01-15'),
(22, 5, 'AVAILABLE', '2023-02-25'),
(23, 5, 'IN_USE', '2023-03-10'),
(24, 5, 'IN_USE', '2023-04-15'),
(25, 5, 'IN_USE', '2023-05-05'),
-- Station 6: bikes_available = 1
(26, 6, 'AVAILABLE', '2023-01-20'),
(27, 6, 'IN_USE', '2023-02-28'),
(28, 6, 'IN_USE', '2023-03-15'),
(29, 6, 'IN_USE', '2023-04-20'),
(30, 6, 'IN_USE', '2023-05-10'),
-- Station 7: bikes_available = 3
(31, 7, 'AVAILABLE', '2023-01-25'),
(32, 7, 'AVAILABLE', '2023-02-15'),
(33, 7, 'AVAILABLE', '2023-03-20'),
(34, 7, 'IN_USE', '2023-04-10'),
(35, 7, 'IN_USE', '2023-05-01'),
-- Station 8: bikes_available = 4
(36, 8, 'AVAILABLE', '2023-01-10'),
(37, 8, 'AVAILABLE', '2023-02-20'),
(38, 8, 'AVAILABLE', '2023-03-10'),
(39, 8, 'AVAILABLE', '2023-04-05'),
(40, 8, 'IN_USE', '2023-05-15'),
-- Station 9: bikes_available = 2
(41, 9, 'AVAILABLE', '2023-01-15'),
(42, 9, 'AVAILABLE', '2023-02-25'),
(43, 9, 'IN_USE', '2023-03-10'),
(44, 9, 'IN_USE', '2023-04-20'),
(45, 9, 'IN_USE', '2023-05-05'),
-- Station 10: bikes_available = 3
(46, 10, 'AVAILABLE', '2023-01-20'),
(47, 10, 'AVAILABLE', '2023-02-28'),
(48, 10, 'AVAILABLE', '2023-03-15'),
(49, 10, 'IN_USE', '2023-04-10'),
(50, 10, 'IN_USE', '2023-05-01'),
-- 보통 (5개): Station 11-15
-- Station 11: bikes_available = 5
(51, 11, 'AVAILABLE', '2023-01-10'),
(52, 11, 'AVAILABLE', '2023-02-20'),
(53, 11, 'AVAILABLE', '2023-03-10'),
(54, 11, 'AVAILABLE', '2023-04-05'),
(55, 11, 'AVAILABLE', '2023-05-15'),
(56, 11, 'IN_USE', '2023-01-20'),
(57, 11, 'IN_USE', '2023-02-25'),
(58, 11, 'IN_USE', '2023-03-15'),
(59, 11, 'IN_USE', '2023-04-20'),
(60, 11, 'IN_USE', '2023-05-05'),
-- Station 12: bikes_available = 6
(61, 12, 'AVAILABLE', '2023-01-15'),
(62, 12, 'AVAILABLE', '2023-02-25'),
(63, 12, 'AVAILABLE', '2023-03-10'),
(64, 12, 'AVAILABLE', '2023-04-20'),
(65, 12, 'AVAILABLE', '2023-05-05'),
(66, 12, 'AVAILABLE', '2023-01-20'),
(67, 12, 'IN_USE', '2023-02-28'),
(68, 12, 'IN_USE', '2023-03-15'),
(69, 12, 'IN_USE', '2023-04-10'),
(70, 12, 'IN_USE', '2023-05-01'),
-- Station 13: bikes_available = 7
(71, 13, 'AVAILABLE', '2023-01-20'),
(72, 13, 'AVAILABLE', '2023-02-28'),
(73, 13, 'AVAILABLE', '2023-03-15'),
(74, 13, 'AVAILABLE', '2023-04-10'),
(75, 13, 'AVAILABLE', '2023-05-01'),
(76, 13, 'AVAILABLE', '2023-01-25'),
(77, 13, 'AVAILABLE', '2023-02-15'),
(78, 13, 'IN_USE', '2023-03-20'),
(79, 13, 'IN_USE', '2023-04-05'),
(80, 13, 'IN_USE', '2023-05-10'),
-- Station 14: bikes_available = 5
(81, 14, 'AVAILABLE', '2023-01-25'),
(82, 14, 'AVAILABLE', '2023-02-15'),
(83, 14, 'AVAILABLE', '2023-03-20'),
(84, 14, 'AVAILABLE', '2023-04-05'),
(85, 14, 'AVAILABLE', '2023-05-10'),
(86, 14, 'IN_USE', '2023-01-10'),
(87, 14, 'IN_USE', '2023-02-20'),
(88, 14, 'IN_USE', '2023-03-10'),
(89, 14, 'IN_USE', '2023-04-15'),
(90, 14, 'IN_USE', '2023-05-01'),
-- Station 15: bikes_available = 6
(91, 15, 'AVAILABLE', '2023-01-10'),
(92, 15, 'AVAILABLE', '2023-02-20'),
(93, 15, 'AVAILABLE', '2023-03-10'),
(94, 15, 'AVAILABLE', '2023-04-15'),
(95, 15, 'AVAILABLE', '2023-05-01'),
(96, 15, 'AVAILABLE', '2023-01-15'),
(97, 15, 'IN_USE', '2023-02-25'),
(98, 15, 'IN_USE', '2023-03-10'),
(99, 15, 'IN_USE', '2023-04-20'),
(100, 15, 'IN_USE', '2023-05-05'),
-- 양호 (5개): Station 16-20
-- Station 16: bikes_available = 8
(101, 16, 'AVAILABLE', '2023-01-15'),
(102, 16, 'AVAILABLE', '2023-02-25'),
(103, 16, 'AVAILABLE', '2023-03-10'),
(104, 16, 'AVAILABLE', '2023-04-20'),
(105, 16, 'AVAILABLE', '2023-05-05'),
(106, 16, 'AVAILABLE', '2023-01-20'),
(107, 16, 'AVAILABLE', '2023-02-28'),
(108, 16, 'AVAILABLE', '2023-03-15'),
(109, 16, 'IN_USE', '2023-04-10'),
(110, 16, 'IN_USE', '2023-05-01'),
(111, 16, 'IN_USE', '2023-01-25'),
(112, 16, 'IN_USE', '2023-02-15'),
-- Station 17: bikes_available = 9
(113, 17, 'AVAILABLE', '2023-01-20'),
(114, 17, 'AVAILABLE', '2023-02-28'),
(115, 17, 'AVAILABLE', '2023-03-15'),
(116, 17, 'AVAILABLE', '2023-04-10'),
(117, 17, 'AVAILABLE', '2023-05-01'),
(118, 17, 'AVAILABLE', '2023-01-25'),
(119, 17, 'AVAILABLE', '2023-02-15'),
(120, 17, 'AVAILABLE', '2023-03-20'),
(121, 17, 'AVAILABLE', '2023-04-05'),
(122, 17, 'IN_USE', '2023-05-10'),
(123, 17, 'IN_USE', '2023-01-10'),
-- Station 18: bikes_available = 10
(124, 18, 'AVAILABLE', '2023-01-25'),
(125, 18, 'AVAILABLE', '2023-02-15'),
(126, 18, 'AVAILABLE', '2023-03-20'),
(127, 18, 'AVAILABLE', '2023-04-05'),
(128, 18, 'AVAILABLE', '2023-05-10'),
(129, 18, 'AVAILABLE', '2023-01-10'),
(130, 18, 'AVAILABLE', '2023-02-20'),
(131, 18, 'AVAILABLE', '2023-03-10'),
(132, 18, 'AVAILABLE', '2023-04-15'),
(133, 18, 'AVAILABLE', '2023-05-01'),
(134, 18, 'IN_USE', '2023-01-15'),
-- Station 19: bikes_available = 11
(135, 19, 'AVAILABLE', '2023-01-10'),
(136, 19, 'AVAILABLE', '2023-02-20'),
(137, 19, 'AVAILABLE', '2023-03-10'),
(138, 19, 'AVAILABLE', '2023-04-15'),
(139, 19, 'AVAILABLE', '2023-05-01'),
(140, 19, 'AVAILABLE', '2023-01-15'),
(141, 19, 'AVAILABLE', '2023-02-25'),
(142, 19, 'AVAILABLE', '2023-03-10'),
(143, 19, 'AVAILABLE', '2023-04-20'),
(144, 19, 'AVAILABLE', '2023-05-05'),
(145, 19, 'AVAILABLE', '2023-01-20'),
(146, 19, 'IN_USE', '2023-02-28'),
(147, 19, 'IN_USE', '2023-03-15'),
-- Station 20: bikes_available = 12
(148, 20, 'AVAILABLE', '2023-01-15'),
(149, 20, 'AVAILABLE', '2023-02-25'),
(150, 20, 'AVAILABLE', '2023-03-10'),
(151, 20, 'AVAILABLE', '2023-04-20'),
(152, 20, 'AVAILABLE', '2023-05-05'),
(153, 20, 'AVAILABLE', '2023-01-20'),
(154, 20, 'AVAILABLE', '2023-02-28'),
(155, 20, 'AVAILABLE', '2023-03-15'),
(156, 20, 'AVAILABLE', '2023-04-10'),
(157, 20, 'AVAILABLE', '2023-05-01'),
(158, 20, 'AVAILABLE', '2023-01-25'),
(159, 20, 'AVAILABLE', '2023-02-15'),
(160, 20, 'IN_USE', '2023-03-20'),
(161, 20, 'IN_USE', '2023-04-05'),
(162, 20, 'IN_USE', '2023-05-10'),
-- 여유 (4개): Station 21-24
-- Station 21: bikes_available = 13
(163, 21, 'AVAILABLE', '2023-01-10'),
(164, 21, 'AVAILABLE', '2023-02-20'),
(165, 21, 'AVAILABLE', '2023-03-10'),
(166, 21, 'AVAILABLE', '2023-04-05'),
(167, 21, 'AVAILABLE', '2023-05-15'),
(168, 21, 'AVAILABLE', '2023-01-15'),
(169, 21, 'AVAILABLE', '2023-02-25'),
(170, 21, 'AVAILABLE', '2023-03-10'),
(171, 21, 'AVAILABLE', '2023-04-20'),
(172, 21, 'AVAILABLE', '2023-05-05'),
(173, 21, 'AVAILABLE', '2023-01-20'),
(174, 21, 'AVAILABLE', '2023-02-28'),
(175, 21, 'AVAILABLE', '2023-03-15'),
(176, 21, 'IN_USE', '2023-04-10'),
(177, 21, 'IN_USE', '2023-05-01'),
(178, 21, 'IN_USE', '2023-01-25'),
(179, 21, 'IN_USE', '2023-02-15'),
-- Station 22: bikes_available = 14
(180, 22, 'AVAILABLE', '2023-01-25'),
(181, 22, 'AVAILABLE', '2023-02-15'),
(182, 22, 'AVAILABLE', '2023-03-20'),
(183, 22, 'AVAILABLE', '2023-04-05'),
(184, 22, 'AVAILABLE', '2023-05-10'),
(185, 22, 'AVAILABLE', '2023-01-10'),
(186, 22, 'AVAILABLE', '2023-02-20'),
(187, 22, 'AVAILABLE', '2023-03-10'),
(188, 22, 'AVAILABLE', '2023-04-15'),
(189, 22, 'AVAILABLE', '2023-05-01'),
(190, 22, 'AVAILABLE', '2023-01-15'),
(191, 22, 'AVAILABLE', '2023-02-25'),
(192, 22, 'AVAILABLE', '2023-03-10'),
(193, 22, 'AVAILABLE', '2023-04-20'),
(194, 22, 'IN_USE', '2023-05-05'),
(195, 22, 'IN_USE', '2023-01-20'),
(196, 22, 'IN_USE', '2023-02-28'),
-- Station 23: bikes_available = 15
(197, 23, 'AVAILABLE', '2023-01-20'),
(198, 23, 'AVAILABLE', '2023-02-28'),
(199, 23, 'AVAILABLE', '2023-03-15'),
(200, 23, 'AVAILABLE', '2023-04-10'),
(201, 23, 'AVAILABLE', '2023-05-01'),
(202, 23, 'AVAILABLE', '2023-01-25'),
(203, 23, 'AVAILABLE', '2023-02-15'),
(204, 23, 'AVAILABLE', '2023-03-20'),
(205, 23, 'AVAILABLE', '2023-04-05'),
(206, 23, 'AVAILABLE', '2023-05-10'),
(207, 23, 'AVAILABLE', '2023-01-10'),
(208, 23, 'AVAILABLE', '2023-02-20'),
(209, 23, 'AVAILABLE', '2023-03-10'),
(210, 23, 'AVAILABLE', '2023-04-15'),
(211, 23, 'AVAILABLE', '2023-05-01'),
(212, 23, 'IN_USE', '2023-01-15'),
(213, 23, 'IN_USE', '2023-02-25'),
(214, 23, 'IN_USE', '2023-03-10'),
(215, 23, 'IN_USE', '2023-04-20'),
(216, 23, 'IN_USE', '2023-05-05'),
-- Station 24: bikes_available = 16
(217, 24, 'AVAILABLE', '2023-01-15'),
(218, 24, 'AVAILABLE', '2023-02-25'),
(219, 24, 'AVAILABLE', '2023-03-10'),
(220, 24, 'AVAILABLE', '2023-04-20'),
(221, 24, 'AVAILABLE', '2023-05-05'),
(222, 24, 'AVAILABLE', '2023-01-20'),
(223, 24, 'AVAILABLE', '2023-02-28'),
(224, 24, 'AVAILABLE', '2023-03-15'),
(225, 24, 'AVAILABLE', '2023-04-10'),
(226, 24, 'AVAILABLE', '2023-05-01'),
(227, 24, 'AVAILABLE', '2023-01-25'),
(228, 24, 'AVAILABLE', '2023-02-15'),
(229, 24, 'AVAILABLE', '2023-03-20'),
(230, 24, 'AVAILABLE', '2023-04-05'),
(231, 24, 'AVAILABLE', '2023-05-10'),
(232, 24, 'AVAILABLE', '2023-01-10'),
(233, 24, 'IN_USE', '2023-02-20'),
(234, 24, 'IN_USE', '2023-03-10'),
-- 나머지 5개 (양호 상태): Station 25-29
-- Station 25: bikes_available = 10
(235, 25, 'AVAILABLE', '2023-01-10'),
(236, 25, 'AVAILABLE', '2023-02-20'),
(237, 25, 'AVAILABLE', '2023-03-10'),
(238, 25, 'AVAILABLE', '2023-04-15'),
(239, 25, 'AVAILABLE', '2023-05-01'),
(240, 25, 'AVAILABLE', '2023-01-15'),
(241, 25, 'AVAILABLE', '2023-02-25'),
(242, 25, 'AVAILABLE', '2023-03-10'),
(243, 25, 'AVAILABLE', '2023-04-20'),
(244, 25, 'AVAILABLE', '2023-05-05'),
(245, 25, 'IN_USE', '2023-01-20'),
(246, 25, 'IN_USE', '2023-02-28'),
(247, 25, 'IN_USE', '2023-03-15'),
(248, 25, 'IN_USE', '2023-04-10'),
(249, 25, 'IN_USE', '2023-05-01'),
-- Station 26: bikes_available = 9
(250, 26, 'AVAILABLE', '2023-01-20'),
(251, 26, 'AVAILABLE', '2023-02-28'),
(252, 26, 'AVAILABLE', '2023-03-15'),
(253, 26, 'AVAILABLE', '2023-04-10'),
(254, 26, 'AVAILABLE', '2023-05-01'),
(255, 26, 'AVAILABLE', '2023-01-25'),
(256, 26, 'AVAILABLE', '2023-02-15'),
(257, 26, 'AVAILABLE', '2023-03-20'),
(258, 26, 'AVAILABLE', '2023-04-05'),
(259, 26, 'IN_USE', '2023-05-10'),
(260, 26, 'IN_USE', '2023-01-10'),
(261, 26, 'IN_USE', '2023-02-20'),
(262, 26, 'IN_USE', '2023-03-10'),
(263, 26, 'IN_USE', '2023-04-15'),
(264, 26, 'IN_USE', '2023-05-01'),
-- Station 27: bikes_available = 11
(265, 27, 'AVAILABLE', '2023-01-25'),
(266, 27, 'AVAILABLE', '2023-02-15'),
(267, 27, 'AVAILABLE', '2023-03-20'),
(268, 27, 'AVAILABLE', '2023-04-05'),
(269, 27, 'AVAILABLE', '2023-05-10'),
(270, 27, 'AVAILABLE', '2023-01-10'),
(271, 27, 'AVAILABLE', '2023-02-20'),
(272, 27, 'AVAILABLE', '2023-03-10'),
(273, 27, 'AVAILABLE', '2023-04-15'),
(274, 27, 'AVAILABLE', '2023-05-01'),
(275, 27, 'AVAILABLE', '2023-01-15'),
(276, 27, 'IN_USE', '2023-02-25'),
(277, 27, 'IN_USE', '2023-03-10'),
(278, 27, 'IN_USE', '2023-04-20'),
(279, 27, 'IN_USE', '2023-05-05'),
-- Station 28: bikes_available = 10
(280, 28, 'AVAILABLE', '2023-01-10'),
(281, 28, 'AVAILABLE', '2023-02-20'),
(282, 28, 'AVAILABLE', '2023-03-10'),
(283, 28, 'AVAILABLE', '2023-04-15'),
(284, 28, 'AVAILABLE', '2023-05-01'),
(285, 28, 'AVAILABLE', '2023-01-15'),
(286, 28, 'AVAILABLE', '2023-02-25'),
(287, 28, 'AVAILABLE', '2023-03-10'),
(288, 28, 'AVAILABLE', '2023-04-20'),
(289, 28, 'AVAILABLE', '2023-05-05'),
(290, 28, 'IN_USE', '2023-01-20'),
(291, 28, 'IN_USE', '2023-02-28'),
(292, 28, 'IN_USE', '2023-03-15'),
(293, 28, 'IN_USE', '2023-04-10'),
(294, 28, 'IN_USE', '2023-05-01'),
-- Station 29: bikes_available = 8
(295, 29, 'AVAILABLE', '2023-01-20'),
(296, 29, 'AVAILABLE', '2023-02-28'),
(297, 29, 'AVAILABLE', '2023-03-15'),
(298, 29, 'AVAILABLE', '2023-04-10'),
(299, 29, 'AVAILABLE', '2023-05-01'),
(300, 29, 'AVAILABLE', '2023-01-25'),
(301, 29, 'AVAILABLE', '2023-02-15'),
(302, 29, 'AVAILABLE', '2023-03-20'),
(303, 29, 'IN_USE', '2023-04-05'),
(304, 29, 'IN_USE', '2023-05-10'),
(305, 29, 'IN_USE', '2023-01-10'),
(306, 29, 'IN_USE', '2023-02-20'),
(307, 29, 'IN_USE', '2023-03-10'),
(308, 29, 'IN_USE', '2023-04-15'),
(309, 29, 'IN_USE', '2023-05-01'),
-- Station 30: bikes_available = 10
(310, 30, 'AVAILABLE', '2023-01-10'),
(311, 30, 'AVAILABLE', '2023-01-20'),
(312, 30, 'AVAILABLE', '2023-02-05'),
(313, 30, 'AVAILABLE', '2023-02-15'),
(314, 30, 'AVAILABLE', '2023-03-01'),
(315, 30, 'AVAILABLE', '2023-03-10'),
(316, 30, 'AVAILABLE', '2023-03-20'),
(317, 30, 'AVAILABLE', '2023-04-01'),
(318, 30, 'AVAILABLE', '2023-04-10'),
(319, 30, 'AVAILABLE', '2023-04-20'),
(320, 30, 'IN_USE', '2023-05-01'),
(321, 30, 'IN_USE', '2023-05-10'),
(322, 30, 'IN_USE', '2023-05-20'),
(323, 30, 'IN_USE', '2023-02-28'),
(324, 30, 'IN_USE', '2023-01-15');

-- Insert rentals (최근 7일 대여 데이터 추가)
INSERT INTO rentals (rental_id, user_id, bike_id, start_station, end_station, start_time, end_time, fee) VALUES
-- 7일 전
(1, 2, 1, 1, 2, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 9 HOUR, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 9 HOUR + INTERVAL 30 MINUTE, 1000),
(2, 2, 6, 2, 3, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 14 HOUR, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 14 HOUR + INTERVAL 45 MINUTE, 1500),
(3, 3, 11, 3, 4, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 8 HOUR + INTERVAL 30 MINUTE, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 9 HOUR + INTERVAL 15 MINUTE, 2000),
(4, 2, 16, 4, 5, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 17 HOUR, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 17 HOUR + INTERVAL 30 MINUTE, 1000),
(5, 3, 21, 5, 6, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 12 HOUR, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 12 HOUR + INTERVAL 20 MINUTE, 500),
-- 6일 전
(6, 2, 2, 1, 3, DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 8 HOUR, DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 8 HOUR + INTERVAL 25 MINUTE, 800),
(7, 3, 12, 3, 5, DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 10 HOUR, DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 10 HOUR + INTERVAL 40 MINUTE, 1200),
(8, 2, 22, 5, 7, DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 15 HOUR, DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 15 HOUR + INTERVAL 35 MINUTE, 1100),
(9, 3, 26, 6, 8, DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 18 HOUR, DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 18 HOUR + INTERVAL 20 MINUTE, 600),
(10, 2, 31, 7, 9, DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 7 HOUR, DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 7 HOUR + INTERVAL 50 MINUTE, 1500),
-- 5일 전
(11, 2, 7, 2, 4, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 9 HOUR, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 9 HOUR + INTERVAL 30 MINUTE, 1000),
(12, 3, 17, 4, 6, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 11 HOUR, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 11 HOUR + INTERVAL 45 MINUTE, 1300),
(13, 2, 27, 6, 8, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 13 HOUR, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 13 HOUR + INTERVAL 25 MINUTE, 900),
(14, 3, 36, 8, 10, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 16 HOUR, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 16 HOUR + INTERVAL 30 MINUTE, 1000),
(15, 2, 41, 9, 11, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 19 HOUR, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 19 HOUR + INTERVAL 15 MINUTE, 700),
-- 4일 전
(16, 2, 13, 3, 5, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 8 HOUR, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 8 HOUR + INTERVAL 35 MINUTE, 1100),
(17, 3, 18, 4, 7, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 10 HOUR, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 10 HOUR + INTERVAL 40 MINUTE, 1200),
(18, 2, 28, 6, 9, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 12 HOUR, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 12 HOUR + INTERVAL 20 MINUTE, 800),
(19, 3, 37, 8, 11, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 14 HOUR, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 14 HOUR + INTERVAL 50 MINUTE, 1500),
(20, 2, 42, 9, 12, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 17 HOUR, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 17 HOUR + INTERVAL 25 MINUTE, 900),
-- 3일 전
(21, 2, 3, 1, 4, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 7 HOUR, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 7 HOUR + INTERVAL 45 MINUTE, 1400),
(22, 3, 19, 4, 8, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 9 HOUR, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 9 HOUR + INTERVAL 30 MINUTE, 1000),
(23, 2, 29, 6, 10, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 11 HOUR, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 11 HOUR + INTERVAL 40 MINUTE, 1200),
(24, 3, 38, 8, 12, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 13 HOUR, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 13 HOUR + INTERVAL 20 MINUTE, 800),
(25, 2, 43, 9, 13, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 15 HOUR, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 15 HOUR + INTERVAL 35 MINUTE, 1100),
-- 2일 전
(26, 2, 8, 2, 6, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 8 HOUR, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 8 HOUR + INTERVAL 30 MINUTE, 1000),
(27, 3, 20, 4, 7, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 10 HOUR, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 10 HOUR + INTERVAL 45 MINUTE, 1300),
(28, 2, 30, 6, 11, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 12 HOUR, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 12 HOUR + INTERVAL 25 MINUTE, 900),
(29, 3, 39, 8, 14, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 14 HOUR, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 14 HOUR + INTERVAL 30 MINUTE, 1000),
(30, 2, 44, 9, 15, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 16 HOUR, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 16 HOUR + INTERVAL 20 MINUTE, 700),
-- 1일 전
(31, 2, 14, 3, 7, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR + INTERVAL 35 MINUTE, 1100),
(32, 3, 24, 5, 9, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 11 HOUR, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 11 HOUR + INTERVAL 40 MINUTE, 1200),
(33, 2, 32, 7, 13, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 13 HOUR, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 13 HOUR + INTERVAL 25 MINUTE, 900),
(34, 3, 40, 8, 16, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 15 HOUR, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 15 HOUR + INTERVAL 30 MINUTE, 1000),
(35, 2, 45, 9, 17, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 17 HOUR, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 17 HOUR + INTERVAL 20 MINUTE, 700),
-- 오늘
(36, 2, 15, 3, 8, DATE_SUB(NOW(), INTERVAL 6 HOUR), DATE_SUB(NOW(), INTERVAL 5 HOUR) + INTERVAL 30 MINUTE, 1000),
(37, 3, 25, 5, 10, DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR) + INTERVAL 15 MINUTE, 800),
(38, 2, 33, 7, 14, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR) + INTERVAL 45 MINUTE, 1300),
(39, 3, 46, 10, 18, DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 30 MINUTE), 600),
(40, 2, 51, 11, 19, NOW() - INTERVAL 30 MINUTE, NULL, 0);

-- Insert achievement definitions (스탬프 형식)
INSERT INTO achievement_defs (achv_id, code, name, criteria, icon_url) VALUES
-- 신고 관련 배지
(1, 'FIRST_REPORT', '첫 신고 기여', '{"type": "valid_reports", "count": 1}', '/icons/first-report.png'),
(2, 'REPORT_DETECTIVE', '현장 탐정', '{"type": "valid_reports", "count": 3}', '/icons/report-detective.png'),
(3, 'REPORT_PARTNER', '정비 파트너', '{"type": "valid_reports", "count": 5}', '/icons/report-partner.png'),
-- 대여 관련 배지 (환경 보호자)
(4, 'ENV_PROTECTOR_1', '환경 보호자 1단계', '{"type": "rentals", "count": 5}', '/icons/env-protector-1.png'),
(5, 'ENV_PROTECTOR_2', '환경 보호자 2단계', '{"type": "rentals", "count": 10}', '/icons/env-protector-2.png'),
(6, 'ENV_PROTECTOR_3', '환경 보호자 3단계', '{"type": "rentals", "count": 20}', '/icons/env-protector-3.png'),
-- 균형자 배지 (부족 대여소에 반납)
(7, 'BALANCER_1', '균형자 1단계', '{"type": "low_station_returns", "count": 1}', '/icons/balancer-1.png'),
(8, 'BALANCER_2', '균형자 2단계', '{"type": "low_station_returns", "count": 5}', '/icons/balancer-2.png'),
(9, 'BALANCER_3', '균형자 3단계', '{"type": "low_station_returns", "count": 10}', '/icons/balancer-3.png');

-- Insert favorites
INSERT INTO favorites (user_id, station_id) VALUES
(2, 1),
(2, 4),
(2, 11),
(3, 16),
(3, 21);

-- Insert posts
INSERT INTO posts (post_id, author_id, title, body, image_url, views) VALUES
(1, 2, '강남역 대여소 이용 후기', '강남역 대여소가 깨끗하고 관리가 잘 되어있어서 좋았습니다!', NULL, 15),
(2, 3, '홍대 대여소 혼잡도', '홍대 대여소는 주말에 특히 혼잡하니 미리 확인하세요.', NULL, 23),
(3, 2, '자전거 이용 팁', '비 오는 날에는 미리 대여소 상태를 확인하는 게 좋습니다.', NULL, 8);

-- Insert comments
INSERT INTO comments (comment_id, post_id, author_id, body) VALUES
(1, 1, 3, '저도 강남역 자주 이용하는데 좋아요!'),
(2, 2, 2, '주말 피크 시간대는 정말 바쁘네요.'),
(3, 1, 2, '추가로 역삼역도 추천합니다.');

-- Insert likes
INSERT INTO likes (post_id, user_id) VALUES
(1, 3),
(2, 2),
(2, 3),
(3, 2);

-- Insert fault reports
INSERT INTO fault_reports (report_id, reporter_id, station_id, bike_id, category, content, photo_url, status, is_valid) VALUES
(1, 2, 1, 6, 'BRAKE_ISSUE', '브레이크가 잘 작동하지 않습니다.', NULL, 'DONE', TRUE),
(2, 3, 5, NULL, 'DOCK_FAULT', '대여소 도크가 고장났어요.', NULL, 'IN_PROGRESS', NULL),
(3, 2, 8, NULL, 'DISPLAY_ERROR', '대여소 화면에 오류가 있습니다.', NULL, 'RECEIVED', NULL);

-- Insert maintenance orders
INSERT INTO maintenance_orders (order_id, report_id, assignee_id, priority, status, due_date) VALUES
(1, 1, 1, 2, 'DONE', '2024-01-16'),
(2, 2, 1, 1, 'WORKING', '2024-01-20'),
(3, 3, 1, 3, 'ASSIGNED', '2024-01-25');

-- Insert alerts
INSERT INTO alerts (user_id, type, ref_id, message, is_read) VALUES
(2, 'REPORT', 1, '고장 신고가 검증되었습니다. 배지를 획득했습니다!', FALSE),
(2, 'MAINT', 1, '고장 신고 #1의 유지보수가 완료되었습니다.', TRUE),
(3, 'REPORT', 2, '고장 신고가 접수되었습니다.', FALSE);

