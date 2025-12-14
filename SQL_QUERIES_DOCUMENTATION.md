# 주요 SQL 예시 및 설명

## 실제 코드에서 사용한 SQL 쿼리 정리

---

## 4.1 DB 구축/초기화에 사용한 SQL

### 4.1.1 테이블 생성 (CREATE TABLE)

#### 목적
- 데이터베이스 스키마 구축
- 테이블, 인덱스, 외래 키 제약 조건 정의

#### SQL 예시

```sql
-- Users table
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    role ENUM('USER', 'ADMIN') DEFAULT 'USER',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Areas table
CREATE TABLE areas (
    area_id INT AUTO_INCREMENT PRIMARY KEY,
    area_name VARCHAR(100) NOT NULL,
    INDEX idx_area_name (area_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stations table
CREATE TABLE stations (
    station_id INT AUTO_INCREMENT PRIMARY KEY,
    area_id INT NOT NULL,
    station_name VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    docks_total INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (area_id) REFERENCES areas(area_id) ON DELETE RESTRICT,
    INDEX idx_area_id (area_id),
    INDEX idx_location (latitude, longitude),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Station status snapshots
CREATE TABLE station_status (
    status_id INT AUTO_INCREMENT PRIMARY KEY,
    station_id INT NOT NULL,
    snapshot_ts TIMESTAMP NOT NULL,
    bikes_available INT DEFAULT 0,
    docks_available INT DEFAULT 0,
    FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
    UNIQUE KEY unique_station_snapshot (station_id, snapshot_ts),
    INDEX idx_station_id (station_id),
    INDEX idx_snapshot_ts (snapshot_ts DESC),
    INDEX idx_station_snapshot (station_id, snapshot_ts DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Station baseline demand
CREATE TABLE station_baseline (
    baseline_id INT AUTO_INCREMENT PRIMARY KEY,
    station_id INT NOT NULL,
    dow INT NOT NULL CHECK (dow BETWEEN 0 AND 6),
    hour INT NOT NULL CHECK (hour BETWEEN 0 AND 23),
    baseline_demand DECIMAL(10, 2) DEFAULT 0,
    samples INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
    UNIQUE KEY unique_station_dow_hour (station_id, dow, hour),
    INDEX idx_station_id (station_id),
    INDEX idx_dow_hour (dow, hour)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bikes table
CREATE TABLE bikes (
    bike_id INT AUTO_INCREMENT PRIMARY KEY,
    station_id INT,
    status ENUM('AVAILABLE', 'IN_USE', 'FAULT', 'MAINTENANCE') DEFAULT 'AVAILABLE',
    purchased_at DATE,
    FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE SET NULL,
    INDEX idx_station_id (station_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rentals table
CREATE TABLE rentals (
    rental_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    bike_id INT NOT NULL,
    start_station INT NOT NULL,
    end_station INT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    fee DECIMAL(10, 2) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (bike_id) REFERENCES bikes(bike_id) ON DELETE RESTRICT,
    FOREIGN KEY (start_station) REFERENCES stations(station_id) ON DELETE RESTRICT,
    FOREIGN KEY (end_station) REFERENCES stations(station_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_bike_id (bike_id),
    INDEX idx_start_time (start_time DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fault reports table
CREATE TABLE fault_reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id INT NOT NULL,
    station_id INT NOT NULL,
    bike_id INT,
    category VARCHAR(50),
    content TEXT NOT NULL,
    photo_url VARCHAR(500),
    status ENUM('RECEIVED', 'IN_PROGRESS', 'DONE', 'REJECTED') DEFAULT 'RECEIVED',
    is_valid BOOLEAN,
    validated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE RESTRICT,
    FOREIGN KEY (bike_id) REFERENCES bikes(bike_id) ON DELETE SET NULL,
    INDEX idx_reporter_id (reporter_id),
    INDEX idx_station_id (station_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Maintenance orders table
CREATE TABLE maintenance_orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    report_id INT UNIQUE,
    assignee_id INT NOT NULL,
    priority INT DEFAULT 0,
    status ENUM('ASSIGNED', 'WORKING', 'DONE', 'CANCELLED') DEFAULT 'ASSIGNED',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES fault_reports(report_id) ON DELETE SET NULL,
    FOREIGN KEY (assignee_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_assignee_id (assignee_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Favorites table
CREATE TABLE favorites (
    fav_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    station_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_station (user_id, station_id),
    INDEX idx_user_id (user_id),
    INDEX idx_station_id (station_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Achievement definitions
CREATE TABLE achievement_defs (
    achv_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    criteria JSON,
    icon_url VARCHAR(500),
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User achievements
CREATE TABLE user_achievements (
    user_id INT NOT NULL,
    achv_id INT NOT NULL,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, achv_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (achv_id) REFERENCES achievement_defs(achv_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_awarded_at (awarded_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alerts table
CREATE TABLE alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('STOCK', 'REPORT', 'MAINT', 'SYSTEM') NOT NULL,
    ref_id INT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Posts table
CREATE TABLE posts (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    author_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    image_url VARCHAR(500),
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_author_id (author_id),
    INDEX idx_created_at (created_at DESC),
    FULLTEXT idx_search (title, body)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comments table
CREATE TABLE comments (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    author_id INT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_author_id (author_id),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Likes table
CREATE TABLE likes (
    like_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_post_user (post_id, user_id),
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 사용 위치
- `db/init/01_schema.sql`

#### 주요 특징
- **AUTO_INCREMENT**: 기본 키 자동 증가
- **FOREIGN KEY**: 참조 무결성 보장
- **INDEX**: 쿼리 성능 최적화
- **UNIQUE KEY**: 중복 방지
- **ENUM**: 제한된 값 집합
- **FULLTEXT**: 전문 검색 인덱스 (posts 테이블)
- **CHECK**: 값 범위 제약 (station_baseline)

---

### 4.1.2 초기 데이터 삽입 (INSERT)

#### 목적
- 테스트 및 개발을 위한 초기 데이터 생성
- 지역, 사용자, 대여소, 자전거, 기준 수요 등 기본 데이터

#### SQL 예시

```sql
-- 지역 데이터
INSERT INTO areas (area_id, area_name) VALUES
(1, '강남구'),
(2, '서초구'),
(3, '송파구'),
(4, '마포구'),
(5, '종로구');

-- 사용자 데이터
INSERT INTO users (user_id, email, password_hash, nickname, role, is_active) VALUES
(1, 'admin@ddarungi.com', '$2b$10$...', '관리자', 'ADMIN', TRUE),
(2, 'user1@ddarungi.com', '$2b$10$...', '사용자1', 'USER', TRUE),
(3, 'user2@ddarungi.com', '$2b$10$...', '사용자2', 'USER', TRUE);

-- 대여소 데이터 (30개)
INSERT INTO stations (station_id, area_id, station_name, latitude, longitude, docks_total, is_active) VALUES
(1, 1, '강남역 1번 출구', 37.4980, 127.0276, 20, TRUE),
(2, 1, '강남역 2번 출구', 37.4990, 127.0286, 15, TRUE),
-- ... (총 30개)

-- 기준 수요 데이터 (모든 대여소, 모든 요일, 모든 시간대)
INSERT INTO station_baseline (station_id, dow, hour, baseline_demand)
SELECT s.station_id, d.dow, h.hour, 10.0
FROM stations s
CROSS JOIN (SELECT 0 as dow UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) d
CROSS JOIN (SELECT 0 as hour UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23) h;

-- 자전거 데이터
INSERT INTO bikes (station_id, status, purchased_at) VALUES
(1, 'AVAILABLE', '2023-01-15'),
(1, 'AVAILABLE', '2023-02-20'),
-- ... (각 대여소별 자전거)

-- 대여 이력 데이터
INSERT INTO rentals (user_id, bike_id, start_station, end_station, start_time, end_time, fee) VALUES
(2, 1, 1, 2, '2024-01-15 08:00:00', '2024-01-15 08:30:00', 1000),
-- ... (최근 7일간 대여 데이터)

-- 배지 정의 데이터
INSERT INTO achievement_defs (code, name, criteria, icon_url) VALUES
('FIRST_REPORT', '첫 신고 기여', '{"count": 1}', '/icons/first_report.png'),
('REPORT_DETECTIVE', '현장 탐정', '{"count": 3}', '/icons/detective.png'),
('REPORT_PARTNER', '정비 파트너', '{"count": 5}', '/icons/partner.png'),
('ENV_PROTECTOR_1', '환경 보호자 1단계', '{"rental_count": 5}', '/icons/env1.png'),
('BALANCER_1', '균형자 1단계', '{"return_count": 1}', '/icons/balancer1.png');
```

#### 사용 위치
- `db/init/02_seed.sql`

#### 주요 특징
- **CROSS JOIN**: 모든 조합 생성 (기준 수요 데이터)
- **AUTO_INCREMENT**: ID 자동 할당 (일부 테이블)
- **외래 키 참조**: 관련 테이블 간 관계 유지

---

### 4.1.3 데이터 초기화 (DELETE + ALTER TABLE)

#### 목적
- 시드 데이터 재실행 시 기존 데이터 삭제
- AUTO_INCREMENT 값 리셋

#### SQL 예시

```sql
-- 외래 키 체크 비활성화
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

-- 데이터 삭제 (외래 키가 있는 테이블부터 역순)
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

-- 안전 모드 재활성화
SET SQL_SAFE_UPDATES = 1;
SET FOREIGN_KEY_CHECKS = 1;

-- AUTO_INCREMENT 리셋
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
```

#### 사용 위치
- `db/init/02_seed.sql` (시작 부분)

#### 주요 특징
- **SET FOREIGN_KEY_CHECKS**: 외래 키 제약 조건 일시 비활성화
- **SET SQL_SAFE_UPDATES**: WHERE 없이 DELETE 허용
- **ALTER TABLE AUTO_INCREMENT**: 자동 증가 값 리셋

---

## 4.2 서비스 기능별 SQL

### 4.2.1 인증 및 사용자 관리

#### (1) 사용자 인증 및 조회 (SELECT + WHERE)

**목적**
- 회원가입 시 이메일 중복 확인
- 로그인 시 사용자 정보 조회
- 현재 로그인한 사용자 정보 조회

**SQL 예시**

```sql
-- 이메일 중복 확인
SELECT user_id FROM users WHERE email = ?

-- 로그인 시 사용자 조회
SELECT user_id, email, password_hash, nickname, role, is_active 
FROM users WHERE email = ?

-- 현재 사용자 정보 조회
SELECT user_id, email, nickname, role, is_active, created_at 
FROM users WHERE user_id = ?
```

**사용 위치**
- `server/routes/auth.js`
  - `POST /api/auth/register` (라인 18-21)
  - `POST /api/auth/login` (라인 65-68)
  - `GET /api/auth/me` (라인 118-121)

**사용 테이블**
- `users`

---

#### (2) 사용자 등록 (INSERT)

**목적**
- 새 사용자 회원가입

**SQL 예시**

```sql
INSERT INTO users (email, password_hash, nickname, role) 
VALUES (?, ?, ?, ?)
```

**사용 위치**
- `server/routes/auth.js`
  - `POST /api/auth/register` (라인 31-34)

**사용 테이블**
- `users`

---

### 4.2.2 대여소 조회 및 관리

#### (3) 대여소 목록 조회 (SELECT + JOIN + 서브쿼리)

**목적**
- 활성 대여소 목록 조회 (지역 정보 포함)
- 각 대여소의 현재 대여 가능 자전거 수 계산

**SQL 예시**

```sql
SELECT s.*, a.area_name,
       (SELECT COUNT(*) FROM bikes 
        WHERE station_id = s.station_id 
        AND status IN ('AVAILABLE', 'FAULT')) as bikes_available
FROM stations s
INNER JOIN areas a ON s.area_id = a.area_id
WHERE s.is_active = TRUE
```

**사용 위치**
- `server/routes/stations.js`
  - `GET /api/stations/nearby` (라인 33-41)
  - `GET /api/stations` (라인 132-140)
- `server/routes/admin.js`
  - `GET /api/admin/stations` (라인 69-77)

**사용 테이블**
- `stations`
- `areas`
- `bikes`

---

#### (4) 기준 수요 조회 (SELECT + 다중 조건)

**목적**
- 현재 요일/시간대의 기준 수요 조회
- 부하율 계산을 위한 기준값 제공

**SQL 예시**

```sql
-- 현재 요일/시간대 기준 수요
SELECT baseline_demand 
FROM station_baseline 
WHERE station_id = ? AND dow = ? AND hour = ?

-- 가장 가까운 시간대 기준 수요 (폴백)
SELECT baseline_demand 
FROM station_baseline 
WHERE station_id = ? AND dow = ? 
ORDER BY ABS(hour - ?) LIMIT 1

-- 기본값 (월요일 8시)
SELECT baseline_demand 
FROM station_baseline 
WHERE station_id = ? AND dow = 1 AND hour = 8 LIMIT 1
```

**사용 위치**
- `server/routes/stations.js`
  - `GET /api/stations/nearby` (라인 80-98)
  - `GET /api/stations/:id` (라인 271-280)
  - `GET /api/stations/congestion/all` (라인 176-181)
- `server/routes/admin.js`
  - `GET /api/admin/stations/utilization` (라인 427-436)

**사용 테이블**
- `station_baseline`

---

#### (5) 대여소 상세 정보 조회 (SELECT + JOIN + 집계)

**목적**
- 특정 대여소의 상세 정보 조회
- 대여소의 자전거 목록 및 상태 조회
- 대여소 상태 이력 조회

**SQL 예시**

```sql
-- 대여소 기본 정보
SELECT s.*, a.area_name 
FROM stations s
INNER JOIN areas a ON s.area_id = a.area_id
WHERE s.station_id = ?

-- 자전거 개수 및 상태별 집계
SELECT 
  COUNT(*) as bikes_available,
  COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END) as available_count,
  COUNT(CASE WHEN status = 'FAULT' THEN 1 END) as fault_count
FROM bikes 
WHERE station_id = ? 
AND status IN ('AVAILABLE', 'FAULT')

-- 자전거 목록
SELECT bike_id, status, purchased_at 
FROM bikes 
WHERE station_id = ? 
AND status IN ('AVAILABLE', 'FAULT')
ORDER BY bike_id
LIMIT ?

-- 최근 7일 상태 이력
SELECT snapshot_ts, bikes_available, docks_available 
FROM station_status 
WHERE station_id = ? 
AND snapshot_ts >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY snapshot_ts ASC

-- 시간대별 기준 수요 (0-23시)
SELECT hour, baseline_demand 
FROM station_baseline 
WHERE station_id = ? AND dow = ? 
ORDER BY hour
```

**사용 위치**
- `server/routes/stations.js`
  - `GET /api/stations/:id` (라인 234-307)

**사용 테이블**
- `stations`
- `areas`
- `bikes`
- `station_status`
- `station_baseline`

---

#### (6) 혼잡도 예측 (SELECT + JOIN + 계산)

**목적**
- 사용자: 특정 시간대의 대여소 혼잡도 예측

**SQL 예시**

```sql
-- 전체 대여소 혼잡도 예측
SELECT s.station_id, s.station_name, s.docks_total, a.area_name,
       (SELECT COUNT(*) FROM bikes 
        WHERE station_id = s.station_id 
        AND status IN ('AVAILABLE', 'FAULT')) as bikes_available
FROM stations s
INNER JOIN areas a ON s.area_id = a.area_id
WHERE s.is_active = TRUE
ORDER BY s.station_id

-- 기준 수요 조회
SELECT station_id, baseline_demand 
FROM station_baseline 
WHERE dow = ? AND hour = ?
```

**사용 위치**
- `server/routes/stations.js`
  - `GET /api/stations/congestion/all` (라인 164-181)

**사용 테이블**
- `stations`
- `areas`
- `bikes`
- `station_baseline`

---

### 4.2.3 커뮤니티 기능

#### (7) 커뮤니티 게시글 목록 (JOIN + 서브쿼리 + FULLTEXT 검색 + 페이징)

**목적**
- 커뮤니티 게시글 목록 조회 (작성자 정보, 댓글 수, 좋아요 수 포함)
- 제목/내용 검색 기능
- 페이징 처리

**SQL 예시**

```sql
-- 게시글 목록 (검색 포함)
SELECT p.*, u.nickname as author_name,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.post_id) as comment_count,
       (SELECT COUNT(*) FROM likes WHERE post_id = p.post_id) as like_count
FROM posts p
INNER JOIN users u ON p.author_id = u.user_id
WHERE MATCH(p.title, p.body) AGAINST(? IN NATURAL LANGUAGE MODE)
ORDER BY p.created_at DESC 
LIMIT ? OFFSET ?

-- 전체 게시글 수
SELECT COUNT(*) as total 
FROM posts
WHERE MATCH(title, body) AGAINST(? IN NATURAL LANGUAGE MODE)
```

**사용 위치**
- `server/routes/community.js`
  - `GET /api/community` (라인 13-43)

**사용 테이블**
- `posts`
- `users`
- `comments`
- `likes`

---

#### (8) 게시글 상세 조회 (JOIN + 서브쿼리 + UPDATE)

**목적**
- 게시글 상세 정보 조회
- 조회수 증가
- 댓글 목록 조회
- 좋아요 수 및 현재 사용자 좋아요 여부 확인

**SQL 예시**

```sql
-- 조회수 증가
UPDATE posts SET views = views + 1 WHERE post_id = ?

-- 게시글 정보
SELECT p.*, u.nickname as author_name
FROM posts p
INNER JOIN users u ON p.author_id = u.user_id
WHERE p.post_id = ?

-- 댓글 목록
SELECT c.*, u.nickname as author_name
FROM comments c
INNER JOIN users u ON c.author_id = u.user_id
WHERE c.post_id = ?
ORDER BY c.created_at ASC

-- 좋아요 수
SELECT COUNT(*) as count FROM likes WHERE post_id = ?

-- 현재 사용자 좋아요 여부
SELECT like_id FROM likes WHERE post_id = ? AND user_id = ?
```

**사용 위치**
- `server/routes/community.js`
  - `GET /api/community/:id` (라인 65-109)

**사용 테이블**
- `posts`
- `users`
- `comments`
- `likes`

---

#### (9) 게시글 작성 (INSERT)

**목적**
- 새 게시글 작성

**SQL 예시**

```sql
INSERT INTO posts (author_id, title, body, image_url) 
VALUES (?, ?, ?, ?)
```

**사용 위치**
- `server/routes/community.js`
  - `POST /api/community` (라인 131-134)

**사용 테이블**
- `posts`

---

#### (10) 게시글 수정 (UPDATE + 소유권 확인)

**목적**
- 게시글 수정 (작성자만 가능)

**SQL 예시**

```sql
-- 소유권 확인
SELECT author_id FROM posts WHERE post_id = ?

-- 게시글 수정
UPDATE posts SET title = ?, body = ?, image_url = ? 
WHERE post_id = ?
```

**사용 위치**
- `server/routes/community.js`
  - `PUT /api/community/:id` (라인 152-168)

**사용 테이블**
- `posts`

---

#### (11) 게시글 삭제 (DELETE + 소유권 확인)

**목적**
- 게시글 삭제 (작성자 또는 관리자만 가능)

**SQL 예시**

```sql
-- 소유권 확인
SELECT author_id FROM posts WHERE post_id = ?

-- 게시글 삭제
DELETE FROM posts WHERE post_id = ?
```

**사용 위치**
- `server/routes/community.js`
  - `DELETE /api/community/:id` (라인 186-199)

**사용 테이블**
- `posts`

---

#### (12) 댓글 작성 (INSERT)

**목적**
- 게시글에 댓글 작성

**SQL 예시**

```sql
INSERT INTO comments (post_id, author_id, body) 
VALUES (?, ?, ?)
```

**사용 위치**
- `server/routes/community.js`
  - `POST /api/community/:id/comments` (라인 227-230)

**사용 테이블**
- `comments`

---

#### (13) 좋아요 토글 (INSERT/DELETE)

**목적**
- 게시글 좋아요/좋아요 취소

**SQL 예시**

```sql
-- 좋아요 여부 확인
SELECT like_id FROM likes WHERE post_id = ? AND user_id = ?

-- 좋아요 추가
INSERT INTO likes (post_id, user_id) VALUES (?, ?)

-- 좋아요 취소
DELETE FROM likes WHERE post_id = ? AND user_id = ?
```

**사용 위치**
- `server/routes/community.js`
  - `POST /api/community/:id/like` (라인 247-266)

**사용 테이블**
- `likes`

---

### 4.2.4 고장 신고 기능

#### (14) 고장 신고 작성 (INSERT + 서브쿼리)

**목적**
- 고장 신고 접수
- 관리자에게 알림 생성

**SQL 예시**

```sql
-- 대여소 존재 확인
SELECT station_id FROM stations WHERE station_id = ?

-- 신고 작성
INSERT INTO fault_reports (reporter_id, station_id, bike_id, category, content, photo_url, status)
VALUES (?, ?, ?, ?, ?, ?, 'RECEIVED')

-- 관리자에게 알림 생성
INSERT INTO alerts (user_id, type, ref_id, message)
SELECT user_id, 'REPORT', ?, CONCAT('새로운 고장 신고가 접수되었습니다: ', ?)
FROM users WHERE role = 'ADMIN'
```

**사용 위치**
- `server/routes/reports.js`
  - `POST /api/reports` (라인 36-60)

**사용 테이블**
- `stations`
- `fault_reports`
- `users`
- `alerts`

---

#### (15) 내 신고 목록 조회 (JOIN + WHERE)

**목적**
- 현재 사용자가 작성한 고장 신고 목록 조회

**SQL 예시**

```sql
SELECT r.*, s.station_name, b.bike_id as bike_number
FROM fault_reports r
LEFT JOIN stations s ON r.station_id = s.station_id
LEFT JOIN bikes b ON r.bike_id = b.bike_id
WHERE r.reporter_id = ?
ORDER BY r.created_at DESC
```

**사용 위치**
- `server/routes/reports.js`
  - `GET /api/reports/mine` (라인 74-82)

**사용 테이블**
- `fault_reports`
- `stations`
- `bikes`

---

#### (16) 특정 대여소의 자전거 목록 조회 (SELECT + WHERE)

**목적**
- 고장 신고 시: 선택한 대여소의 자전거 목록 조회

**SQL 예시**

```sql
SELECT bike_id, status 
FROM bikes 
WHERE station_id = ? 
AND status IN ('AVAILABLE', 'FAULT')
```

**사용 위치**
- `server/routes/reports.js`
  - `GET /api/reports/bikes/:stationId` (추정)

**사용 테이블**
- `bikes`

---

### 4.2.5 즐겨찾기 기능

#### (17) 즐겨찾기 목록 조회 (JOIN + 서브쿼리)

**목적**
- 사용자의 즐겨찾기 대여소 목록 조회

**SQL 예시**

```sql
SELECT f.*, s.station_name, s.latitude, s.longitude, a.area_name,
       (SELECT bikes_available FROM station_status 
        WHERE station_id = s.station_id 
        ORDER BY snapshot_ts DESC LIMIT 1) as bikes_available,
       (SELECT docks_available FROM station_status 
        WHERE station_id = s.station_id 
        ORDER BY snapshot_ts DESC LIMIT 1) as docks_available
FROM favorites f
INNER JOIN stations s ON f.station_id = s.station_id
INNER JOIN areas a ON s.area_id = a.area_id
WHERE f.user_id = ?
ORDER BY f.created_at DESC
```

**사용 위치**
- `server/routes/favorites.js`
  - `GET /api/favorites` (라인 10-24)

**사용 테이블**
- `favorites`
- `stations`
- `areas`
- `station_status`

---

#### (18) 즐겨찾기 추가 (INSERT + 중복 확인)

**목적**
- 대여소를 즐겨찾기에 추가

**SQL 예시**

```sql
-- 대여소 존재 확인
SELECT station_id FROM stations WHERE station_id = ?

-- 즐겨찾기 중복 확인
SELECT fav_id FROM favorites WHERE user_id = ? AND station_id = ?

-- 즐겨찾기 추가
INSERT INTO favorites (user_id, station_id) VALUES (?, ?)
```

**사용 위치**
- `server/routes/favorites.js`
  - `POST /api/favorites` (라인 42-65)

**사용 테이블**
- `favorites`
- `stations`

---

#### (19) 즐겨찾기 삭제 (DELETE)

**목적**
- 즐겨찾기에서 대여소 제거

**SQL 예시**

```sql
DELETE FROM favorites WHERE user_id = ? AND station_id = ?
```

**사용 위치**
- `server/routes/favorites.js`
  - `DELETE /api/favorites/:stationId` (라인 78-81)

**사용 테이블**
- `favorites`

---

### 4.2.6 마이페이지 기능

#### (20) 마이페이지 데이터 조회 (다중 JOIN + 서브쿼리)

**목적**
- 사용자 프로필, 대여 이력, 즐겨찾기, 신고 목록, 배지, 알림 조회

**SQL 예시**

```sql
-- 사용자 프로필
SELECT user_id, email, nickname, role, created_at 
FROM users WHERE user_id = ?

-- 대여 이력
SELECT r.*, 
       s1.station_name as start_station_name,
       s2.station_name as end_station_name
FROM rentals r
LEFT JOIN stations s1 ON r.start_station = s1.station_id
LEFT JOIN stations s2 ON r.end_station = s2.station_id
WHERE r.user_id = ?
ORDER BY r.start_time DESC
LIMIT 20

-- 즐겨찾기
SELECT f.*, s.station_name, a.area_name
FROM favorites f
INNER JOIN stations s ON f.station_id = s.station_id
INNER JOIN areas a ON s.area_id = a.area_id
WHERE f.user_id = ?
ORDER BY f.created_at DESC

-- 신고 목록
SELECT r.*, s.station_name
FROM fault_reports r
LEFT JOIN stations s ON r.station_id = s.station_id
WHERE r.reporter_id = ?
ORDER BY r.created_at DESC

-- 배지 목록
SELECT ua.*, ad.code, ad.name, ad.icon_url
FROM user_achievements ua
INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
WHERE ua.user_id = ?
ORDER BY ua.awarded_at DESC

-- 읽지 않은 알림
SELECT * FROM alerts
WHERE user_id = ? AND is_read = FALSE
ORDER BY created_at DESC
```

**사용 위치**
- `server/routes/mypage.js`
  - `GET /api/mypage` (라인 13-75)

**사용 테이블**
- `users`
- `rentals`
- `stations`
- `favorites`
- `areas`
- `fault_reports`
- `user_achievements`
- `achievement_defs`
- `alerts`

---

#### (21) 알림 읽음 처리 (UPDATE)

**목적**
- 사용자: 알림을 읽음으로 표시

**SQL 예시**

```sql
UPDATE alerts SET is_read = TRUE 
WHERE alert_id = ? AND user_id = ?
```

**사용 위치**
- `server/routes/mypage.js`
  - `PUT /api/mypage/alerts/:id/read` (라인 95-98)

**사용 테이블**
- `alerts`

---

### 4.2.7 관리자 기능

#### (22) 관리자 - 회원 목록 조회 (서브쿼리 + 집계)

**목적**
- 관리자: 전체 회원 목록 조회 (대여 횟수, 신고 횟수 포함)

**SQL 예시**

```sql
SELECT user_id, email, nickname, role, is_active, created_at,
       (SELECT COUNT(*) FROM rentals WHERE user_id = u.user_id) as rental_count,
       (SELECT COUNT(*) FROM fault_reports WHERE reporter_id = u.user_id) as report_count
FROM users u
ORDER BY u.created_at DESC
```

**사용 위치**
- `server/routes/admin.js`
  - `GET /api/admin/users` (라인 12-18)

**사용 테이블**
- `users`
- `rentals`
- `fault_reports`

---

#### (23) 관리자 - 회원 역할 변경 (UPDATE)

**목적**
- 관리자: 회원 역할 변경 (USER ↔ ADMIN)

**SQL 예시**

```sql
UPDATE users SET role = ? WHERE user_id = ?
```

**사용 위치**
- `server/routes/admin.js`
  - `PUT /api/admin/users/:id/role` (라인 36-39)

**사용 테이블**
- `users`

---

#### (24) 관리자 - 회원 활성화/비활성화 (UPDATE)

**목적**
- 관리자: 회원 계정 활성화/비활성화

**SQL 예시**

```sql
UPDATE users SET is_active = ? WHERE user_id = ?
```

**사용 위치**
- `server/routes/admin.js`
  - `PUT /api/admin/users/:id/active` (라인 53-56)

**사용 테이블**
- `users`

---

#### (25) 관리자 - 대여소 생성 (INSERT)

**목적**
- 관리자: 새 대여소 생성

**SQL 예시**

```sql
INSERT INTO stations (area_id, station_name, latitude, longitude, docks_total) 
VALUES (?, ?, ?, ?, ?)
```

**사용 위치**
- `server/routes/admin.js`
  - `POST /api/admin/stations` (라인 99-102)

**사용 테이블**
- `stations`

---

#### (26) 관리자 - 대여소 수정 (UPDATE)

**목적**
- 관리자: 대여소 정보 수정

**SQL 예시**

```sql
UPDATE stations 
SET station_name = ?, latitude = ?, longitude = ?, docks_total = ?, is_active = ? 
WHERE station_id = ?
```

**사용 위치**
- `server/routes/admin.js`
  - `PUT /api/admin/stations/:id` (라인 116-119)

**사용 테이블**
- `stations`

---

#### (27) 관리자 - 대여소 활성화/비활성화 (UPDATE)

**목적**
- 관리자: 대여소 활성화/비활성화

**SQL 예시**

```sql
UPDATE stations SET is_active = ? WHERE station_id = ?
```

**사용 위치**
- `server/routes/admin.js`
  - `PUT /api/admin/stations/:id/active` (라인 133-136)

**사용 테이블**
- `stations`

---

#### (28) 관리자 - 자전거 목록 조회 (JOIN)

**목적**
- 관리자: 전체 자전거 목록 조회 (대여소 정보 포함)

**SQL 예시**

```sql
SELECT b.*, s.station_name, a.area_name
FROM bikes b
LEFT JOIN stations s ON b.station_id = s.station_id
LEFT JOIN areas a ON s.area_id = a.area_id
ORDER BY b.bike_id
```

**사용 위치**
- `server/routes/admin.js`
  - `GET /api/admin/bikes` (라인 149-155)

**사용 테이블**
- `bikes`
- `stations`
- `areas`

---

#### (29) 관리자 - 자전거 생성 (INSERT)

**목적**
- 관리자: 새 자전거 등록

**SQL 예시**

```sql
INSERT INTO bikes (station_id, status, purchased_at) 
VALUES (?, ?, ?)
```

**사용 위치**
- `server/routes/admin.js`
  - `POST /api/admin/bikes` (라인 168-171)

**사용 테이블**
- `bikes`

---

#### (30) 관리자 - 자전거 수정 (UPDATE)

**목적**
- 관리자: 자전거 상태 및 대여소 변경

**SQL 예시**

```sql
UPDATE bikes SET station_id = ?, status = ? WHERE bike_id = ?
```

**사용 위치**
- `server/routes/admin.js`
  - `PUT /api/admin/bikes/:id` (라인 185-188)

**사용 테이블**
- `bikes`

---

#### (31) 관리자 - 신고 목록 조회 (다중 JOIN)

**목적**
- 관리자: 전체 고장 신고 목록 조회 (신고자, 대여소, 유지보수 정보 포함)

**SQL 예시**

```sql
SELECT r.*, u.nickname as reporter_name, s.station_name,
       m.order_id, m.status as maintenance_status, m.priority, m.due_date
FROM fault_reports r
LEFT JOIN users u ON r.reporter_id = u.user_id
LEFT JOIN stations s ON r.station_id = s.station_id
LEFT JOIN maintenance_orders m ON r.report_id = m.report_id
ORDER BY r.created_at DESC
```

**사용 위치**
- `server/routes/admin.js`
  - `GET /api/admin/reports` (라인 201-209)

**사용 테이블**
- `fault_reports`
- `users`
- `stations`
- `maintenance_orders`

---

#### (32) 관리자 - 유지보수 주문 생성 (INSERT + UPDATE)

**목적**
- 관리자: 고장 신고에 대한 유지보수 주문 생성 및 신고 상태 업데이트

**SQL 예시**

```sql
-- 기존 주문 확인
SELECT order_id FROM maintenance_orders WHERE report_id = ?

-- 유지보수 주문 생성
INSERT INTO maintenance_orders (report_id, assignee_id, priority, due_date, status)
VALUES (?, ?, ?, ?, 'ASSIGNED')

-- 신고 상태 업데이트
UPDATE fault_reports SET status = ? WHERE report_id = ?

-- 신고자에게 알림 생성
INSERT INTO alerts (user_id, type, ref_id, message) 
VALUES (?, ?, ?, ?)
```

**사용 위치**
- `server/routes/admin.js`
  - `POST /api/admin/reports/:id/maintenance` (라인 228-260)

**사용 테이블**
- `maintenance_orders`
- `fault_reports`
- `alerts`

---

#### (33) 관리자 - 유지보수 주문 수정 (UPDATE)

**목적**
- 관리자: 유지보수 주문 상태, 우선순위, 기한 수정

**SQL 예시**

```sql
-- 유지보수 주문 수정
UPDATE maintenance_orders 
SET status = ?, priority = ?, due_date = ? 
WHERE order_id = ?

-- 완료 시 신고 상태 업데이트
UPDATE fault_reports SET status = ? WHERE report_id = ?
```

**사용 위치**
- `server/routes/admin.js`
  - `PUT /api/admin/maintenance/:id` (라인 274-292)

**사용 테이블**
- `maintenance_orders`
- `fault_reports`

---

#### (34) 관리자 - 신고 검증 (UPDATE + INSERT)

**목적**
- 관리자: 고장 신고 검증 및 배지 부여 트리거 활성화

**SQL 예시**

```sql
-- 신고 검증
UPDATE fault_reports 
SET is_valid = ?, validated_at = NOW(), status = ? 
WHERE report_id = ?

-- 신고자에게 알림 생성
INSERT INTO alerts (user_id, type, ref_id, message) 
VALUES (?, ?, ?, ?)
```

**사용 위치**
- `server/routes/admin.js`
  - `PUT /api/admin/reports/:id/validate` (라인 306-325)

**사용 테이블**
- `fault_reports`
- `alerts`

---

#### (35) 관리자 - 재배치 추천 (CTE + 윈도우 함수 + 서브쿼리)

**목적**
- 관리자: 자전거가 부족한 대여소와 여유 있는 대여소 식별 및 재배치 제안

**SQL 예시**

```sql
WITH latest_status AS (
  SELECT station_id, bikes_available, docks_available, snapshot_ts,
         ROW_NUMBER() OVER (PARTITION BY station_id ORDER BY snapshot_ts DESC) as rn
  FROM station_status
)
SELECT s.station_id, s.station_name, s.docks_total,
       ls.bikes_available, ls.docks_available,
       (ls.bikes_available / NULLIF(s.docks_total, 0)) as utilization_ratio
FROM stations s
LEFT JOIN latest_status ls ON s.station_id = ls.station_id AND ls.rn = 1
WHERE s.is_active = TRUE
ORDER BY ls.bikes_available ASC
```

**사용 위치**
- `server/routes/admin.js`
  - `GET /api/admin/rebalancing` (라인 342-355)

**사용 테이블**
- `stations`
- `station_status`

---

#### (36) 관리자 - 대여소 이용률 지도 (CTE + 윈도우 함수 + JOIN)

**목적**
- 관리자: 각 대여소의 평소 이용률 대비 현재 자전거 배치율 계산 및 색상 표시

**SQL 예시**

```sql
WITH latest_status AS (
  SELECT station_id, bikes_available, docks_available, snapshot_ts,
         ROW_NUMBER() OVER (PARTITION BY station_id ORDER BY snapshot_ts DESC) as rn
  FROM station_status
)
SELECT s.station_id, s.station_name, s.latitude, s.longitude, s.docks_total,
       COALESCE(ls.bikes_available, 0) as bikes_available,
       COALESCE(ls.docks_available, 0) as docks_available,
       (COALESCE(ls.bikes_available, 0) / NULLIF(s.docks_total, 0)) as utilization_rate
FROM stations s
LEFT JOIN latest_status ls ON s.station_id = ls.station_id AND ls.rn = 1
WHERE s.is_active = TRUE
```

**사용 위치**
- `server/routes/admin.js`
  - `GET /api/admin/stations/utilization` (라인 409-422)

**사용 테이블**
- `stations`
- `station_status`

---

#### (37) 관리자 - 통계 대시보드 (집계 + GROUP BY + CTE)

**목적**
- 관리자 대시보드: 다양한 통계 데이터 조회

**SQL 예시**

```sql
-- 최근 7일 대여 통계
SELECT DATE(start_time) as date, COUNT(*) as count
FROM rentals
WHERE start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(start_time)
ORDER BY date ASC

-- 신고 상태별 분포
SELECT status, COUNT(*) as count
FROM fault_reports
GROUP BY status

-- 유지보수 상태별 분포
SELECT status, COUNT(*) as count
FROM maintenance_orders
GROUP BY status

-- 대여소 혼잡도 분포
WITH latest_status AS (
  SELECT station_id, bikes_available, snapshot_ts,
         ROW_NUMBER() OVER (PARTITION BY station_id ORDER BY snapshot_ts DESC) as rn
  FROM station_status
)
SELECT 
  CASE 
    WHEN ls.bikes_available < 3 THEN 'LOW'
    WHEN ls.bikes_available < 10 THEN 'MEDIUM'
    ELSE 'HIGH'
  END as level,
  COUNT(*) as count
FROM stations s
LEFT JOIN latest_status ls ON s.station_id = ls.station_id AND ls.rn = 1
WHERE s.is_active = TRUE
GROUP BY level

-- 전체 사용자 및 활성 사용자 수
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_users
FROM users

-- 지역별 대여소 수
SELECT a.area_name, COUNT(*) as count
FROM stations s
INNER JOIN areas a ON s.area_id = a.area_id
WHERE s.is_active = TRUE
GROUP BY a.area_id, a.area_name

-- 최근 7일 신고 통계
SELECT DATE(created_at) as date, COUNT(*) as count
FROM fault_reports
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY date ASC

-- 자전거 상태별 분포
SELECT status, COUNT(*) as count
FROM bikes
GROUP BY status
```

**사용 위치**
- `server/routes/admin.js`
  - `GET /api/admin/stats` (라인 467-566)

**사용 테이블**
- `rentals`
- `fault_reports`
- `maintenance_orders`
- `station_status`
- `stations`
- `users`
- `areas`
- `bikes`

---

## 4.3 VIEW/TRIGGER 기반 SQL

### 4.3.1 VIEW (뷰)

#### (1) 최신 대여소 상태 뷰 (CREATE VIEW)

**목적**
- 각 대여소의 최신 상태 스냅샷을 쉽게 조회하기 위한 뷰

**SQL 예시**

```sql
CREATE OR REPLACE VIEW latest_station_status AS
SELECT 
    s1.*
FROM station_status s1
INNER JOIN (
    SELECT station_id, MAX(snapshot_ts) as max_ts
    FROM station_status
    GROUP BY station_id
) s2 ON s1.station_id = s2.station_id AND s1.snapshot_ts = s2.max_ts;
```

**사용 위치**
- `db/init/01_schema.sql` (라인 258-266)

**사용 테이블**
- `station_status`

**사용 방법**
```sql
-- 뷰를 일반 테이블처럼 조회
SELECT * FROM latest_station_status WHERE station_id = 1;
```

**주요 특징**
- **서브쿼리 + JOIN**: 각 대여소별 최신 스냅샷만 선택
- **GROUP BY + MAX**: 최신 시간대 추출
- **자동 업데이트**: 기본 테이블(`station_status`)이 변경되면 뷰도 자동 반영

---

### 4.3.2 TRIGGER (트리거)

#### (2) 신고 검증 시 배지 부여 트리거 (AFTER UPDATE)

**목적**
- 고장 신고가 검증되면 자동으로 배지 부여
- 신고 횟수에 따라 단계별 배지 부여 (1회, 3회, 5회, 10회, 20회)

**SQL 예시**

```sql
DELIMITER $$

CREATE TRIGGER award_achievement_on_validation
AFTER UPDATE ON fault_reports
FOR EACH ROW
BEGIN
    DECLARE valid_count INT;
    
    IF NEW.is_valid = TRUE AND (OLD.is_valid IS NULL OR OLD.is_valid = FALSE) THEN
        -- Count valid reports
        SET valid_count = (SELECT COUNT(*) FROM fault_reports WHERE reporter_id = NEW.reporter_id AND is_valid = TRUE);
        
        -- Award achievements based on count (스탬프 형식)
        -- 1회: 첫 신고 기여
        IF valid_count = 1 THEN
            IF NOT EXISTS (
                SELECT 1 FROM user_achievements ua
                INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
                WHERE ua.user_id = NEW.reporter_id AND ad.code = 'FIRST_REPORT'
            ) THEN
                INSERT INTO user_achievements (user_id, achv_id)
                SELECT NEW.reporter_id, achv_id FROM achievement_defs WHERE code = 'FIRST_REPORT' LIMIT 1;
                
                INSERT INTO alerts (user_id, type, ref_id, message)
                VALUES (NEW.reporter_id, 'REPORT', NEW.report_id, '🎉 첫 신고 기여 배지를 획득했습니다!');
            END IF;
        END IF;
        
        -- 3회: 현장 탐정
        IF valid_count = 3 THEN
            IF NOT EXISTS (
                SELECT 1 FROM user_achievements ua
                INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
                WHERE ua.user_id = NEW.reporter_id AND ad.code = 'REPORT_DETECTIVE'
            ) THEN
                INSERT INTO user_achievements (user_id, achv_id)
                SELECT NEW.reporter_id, achv_id FROM achievement_defs WHERE code = 'REPORT_DETECTIVE' LIMIT 1;
                
                INSERT INTO alerts (user_id, type, ref_id, message)
                VALUES (NEW.reporter_id, 'REPORT', NEW.report_id, '🔍 현장 탐정 배지를 획득했습니다!');
            END IF;
        END IF;
        
        -- 5회: 정비 파트너
        IF valid_count = 5 THEN
            IF NOT EXISTS (
                SELECT 1 FROM user_achievements ua
                INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
                WHERE ua.user_id = NEW.reporter_id AND ad.code = 'REPORT_PARTNER'
            ) THEN
                INSERT INTO user_achievements (user_id, achv_id)
                SELECT NEW.reporter_id, achv_id FROM achievement_defs WHERE code = 'REPORT_PARTNER' LIMIT 1;
                
                INSERT INTO alerts (user_id, type, ref_id, message)
                VALUES (NEW.reporter_id, 'REPORT', NEW.report_id, '🤝 정비 파트너 배지를 획득했습니다!');
            END IF;
        END IF;
        
        -- 10회: 신고 전문가
        IF valid_count = 10 THEN
            IF NOT EXISTS (
                SELECT 1 FROM user_achievements ua
                INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
                WHERE ua.user_id = NEW.reporter_id AND ad.code = 'REPORT_EXPERT'
            ) THEN
                INSERT INTO user_achievements (user_id, achv_id)
                SELECT NEW.reporter_id, achv_id FROM achievement_defs WHERE code = 'REPORT_EXPERT' LIMIT 1;
                
                INSERT INTO alerts (user_id, type, ref_id, message)
                VALUES (NEW.reporter_id, 'REPORT', NEW.report_id, '⭐ 신고 전문가 배지를 획득했습니다!');
            END IF;
        END IF;
        
        -- 20회: 신고 마스터
        IF valid_count = 20 THEN
            IF NOT EXISTS (
                SELECT 1 FROM user_achievements ua
                INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
                WHERE ua.user_id = NEW.reporter_id AND ad.code = 'REPORT_MASTER'
            ) THEN
                INSERT INTO user_achievements (user_id, achv_id)
                SELECT NEW.reporter_id, achv_id FROM achievement_defs WHERE code = 'REPORT_MASTER' LIMIT 1;
                
                INSERT INTO alerts (user_id, type, ref_id, message)
                VALUES (NEW.reporter_id, 'REPORT', NEW.report_id, '👑 신고 마스터 배지를 획득했습니다!');
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;
```

**사용 위치**
- `db/init/01_schema.sql` (라인 271-357)

**사용 테이블**
- `fault_reports` (트리거 대상)
- `user_achievements` (INSERT)
- `achievement_defs` (SELECT)
- `alerts` (INSERT)

**트리거 동작**
- **트리거 시점**: `AFTER UPDATE` (업데이트 후)
- **조건**: `is_valid`가 `FALSE` 또는 `NULL`에서 `TRUE`로 변경될 때
- **동작**: 유효한 신고 개수를 세고, 조건에 맞는 배지를 부여

---

#### (3) 대여 시 배지 부여 트리거 (AFTER INSERT)

**목적**
- 자전거 대여 시 환경 보호자 배지 부여
- 대여 횟수에 따라 단계별 배지 부여 (5회, 10회, 20회)

**SQL 예시**

```sql
DELIMITER $$

CREATE TRIGGER award_achievement_on_rental
AFTER INSERT ON rentals
FOR EACH ROW
BEGIN
    DECLARE rental_count INT;
    
    -- Count total rentals
    SET rental_count = (SELECT COUNT(*) FROM rentals WHERE user_id = NEW.user_id);
    
    -- Award achievements based on count
    -- 5회: 환경 보호자 1단계
    IF rental_count = 5 THEN
        IF NOT EXISTS (
            SELECT 1 FROM user_achievements ua
            INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
            WHERE ua.user_id = NEW.user_id AND ad.code = 'ENV_PROTECTOR_1'
        ) THEN
            INSERT INTO user_achievements (user_id, achv_id)
            SELECT NEW.user_id, achv_id FROM achievement_defs WHERE code = 'ENV_PROTECTOR_1' LIMIT 1;
            
            INSERT INTO alerts (user_id, type, ref_id, message)
            VALUES (NEW.user_id, 'SYSTEM', NEW.rental_id, '🌱 환경 보호자 1단계 배지를 획득했습니다!');
        END IF;
    END IF;
    
    -- 10회: 환경 보호자 2단계
    IF rental_count = 10 THEN
        IF NOT EXISTS (
            SELECT 1 FROM user_achievements ua
            INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
            WHERE ua.user_id = NEW.user_id AND ad.code = 'ENV_PROTECTOR_2'
        ) THEN
            INSERT INTO user_achievements (user_id, achv_id)
            SELECT NEW.user_id, achv_id FROM achievement_defs WHERE code = 'ENV_PROTECTOR_2' LIMIT 1;
            
            INSERT INTO alerts (user_id, type, ref_id, message)
            VALUES (NEW.user_id, 'SYSTEM', NEW.rental_id, '🌱 환경 보호자 2단계 배지를 획득했습니다!');
        END IF;
    END IF;
    
    -- 20회: 환경 보호자 3단계
    IF rental_count = 20 THEN
        IF NOT EXISTS (
            SELECT 1 FROM user_achievements ua
            INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
            WHERE ua.user_id = NEW.user_id AND ad.code = 'ENV_PROTECTOR_3'
        ) THEN
            INSERT INTO user_achievements (user_id, achv_id)
            SELECT NEW.user_id, achv_id FROM achievement_defs WHERE code = 'ENV_PROTECTOR_3' LIMIT 1;
            
            INSERT INTO alerts (user_id, type, ref_id, message)
            VALUES (NEW.user_id, 'SYSTEM', NEW.rental_id, '🌱 환경 보호자 3단계 배지를 획득했습니다!');
        END IF;
    END IF;
END$$

DELIMITER ;
```

**사용 위치**
- `db/init/01_schema.sql` (라인 359-414)

**사용 테이블**
- `rentals` (트리거 대상)
- `user_achievements` (INSERT)
- `achievement_defs` (SELECT)
- `alerts` (INSERT)

**트리거 동작**
- **트리거 시점**: `AFTER INSERT` (삽입 후)
- **동작**: 총 대여 횟수를 세고, 조건에 맞는 배지를 부여

---

#### (4) 부족한 대여소 반납 시 배지 부여 트리거 (AFTER UPDATE)

**목적**
- 부족한 대여소(부하율 < 0.5)에 자전거를 반납하면 균형자 배지 부여
- 반납 횟수에 따라 단계별 배지 부여 (1회, 5회, 10회)

**SQL 예시**

```sql
DELIMITER $$

CREATE TRIGGER award_achievement_on_low_station_return
AFTER UPDATE ON rentals
FOR EACH ROW
BEGIN
    DECLARE return_count INT;
    DECLARE station_load_factor DECIMAL(10, 2);
    DECLARE baseline_demand DECIMAL(10, 2);
    DECLARE current_bikes INT;
    
    -- Only process when rental is completed (end_station is set)
    IF NEW.end_station IS NOT NULL AND OLD.end_station IS NULL THEN
        -- Get current station status
        SELECT bikes_available INTO current_bikes
        FROM station_status
        WHERE station_id = NEW.end_station
        ORDER BY snapshot_ts DESC LIMIT 1;
        
        -- Get baseline for current day/hour
        SELECT baseline_demand INTO baseline_demand
        FROM station_baseline
        WHERE station_id = NEW.end_station
        AND dow = DAYOFWEEK(NOW())
        AND hour = HOUR(NOW())
        LIMIT 1;
        
        -- If no baseline, use default 10
        IF baseline_demand IS NULL THEN
            SET baseline_demand = 10;
        END IF;
        
        -- Calculate load factor
        IF baseline_demand > 0 THEN
            SET station_load_factor = current_bikes / baseline_demand;
        ELSE
            SET station_load_factor = 1;
        END IF;
        
        -- If station is low (load_factor < 0.5), award balancer achievement
        IF station_load_factor < 0.5 THEN
            -- Count low station returns
            SET return_count = (
                SELECT COUNT(*) 
                FROM rentals r
                INNER JOIN station_status ss ON r.end_station = ss.station_id
                INNER JOIN station_baseline sb ON r.end_station = sb.station_id
                WHERE r.user_id = NEW.user_id
                AND r.end_station IS NOT NULL
                AND ss.snapshot_ts = (SELECT MAX(snapshot_ts) FROM station_status WHERE station_id = r.end_station)
                AND sb.dow = DAYOFWEEK(r.end_time)
                AND sb.hour = HOUR(r.end_time)
                AND (ss.bikes_available / NULLIF(sb.baseline_demand, 0)) < 0.5
            );
            
            -- 1회: 균형자 1단계
            IF return_count = 1 THEN
                IF NOT EXISTS (
                    SELECT 1 FROM user_achievements ua
                    INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
                    WHERE ua.user_id = NEW.user_id AND ad.code = 'BALANCER_1'
                ) THEN
                    INSERT INTO user_achievements (user_id, achv_id)
                    SELECT NEW.user_id, achv_id FROM achievement_defs WHERE code = 'BALANCER_1' LIMIT 1;
                    
                    INSERT INTO alerts (user_id, type, ref_id, message)
                    VALUES (NEW.user_id, 'SYSTEM', NEW.rental_id, '⚖️ 균형자 1단계 배지를 획득했습니다!');
                END IF;
            END IF;
            
            -- 5회: 균형자 2단계
            IF return_count = 5 THEN
                IF NOT EXISTS (
                    SELECT 1 FROM user_achievements ua
                    INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
                    WHERE ua.user_id = NEW.user_id AND ad.code = 'BALANCER_2'
                ) THEN
                    INSERT INTO user_achievements (user_id, achv_id)
                    SELECT NEW.user_id, achv_id FROM achievement_defs WHERE code = 'BALANCER_2' LIMIT 1;
                    
                    INSERT INTO alerts (user_id, type, ref_id, message)
                    VALUES (NEW.user_id, 'SYSTEM', NEW.rental_id, '⚖️ 균형자 2단계 배지를 획득했습니다!');
                END IF;
            END IF;
            
            -- 10회: 균형자 3단계
            IF return_count = 10 THEN
                IF NOT EXISTS (
                    SELECT 1 FROM user_achievements ua
                    INNER JOIN achievement_defs ad ON ua.achv_id = ad.achv_id
                    WHERE ua.user_id = NEW.user_id AND ad.code = 'BALANCER_3'
                ) THEN
                    INSERT INTO user_achievements (user_id, achv_id)
                    SELECT NEW.user_id, achv_id FROM achievement_defs WHERE code = 'BALANCER_3' LIMIT 1;
                    
                    INSERT INTO alerts (user_id, type, ref_id, message)
                    VALUES (NEW.user_id, 'SYSTEM', NEW.rental_id, '⚖️ 균형자 3단계 배지를 획득했습니다!');
                END IF;
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;
```

**사용 위치**
- `db/init/01_schema.sql` (라인 416-516)

**사용 테이블**
- `rentals` (트리거 대상)
- `station_status` (SELECT)
- `station_baseline` (SELECT)
- `user_achievements` (INSERT)
- `achievement_defs` (SELECT)
- `alerts` (INSERT)

**트리거 동작**
- **트리거 시점**: `AFTER UPDATE` (업데이트 후)
- **조건**: `end_station`이 `NULL`에서 값으로 변경될 때 (반납 완료)
- **동작**: 
  1. 반납한 대여소의 현재 부하율 계산
  2. 부하율이 0.5 미만이면 균형자 배지 부여
  3. 부족한 대여소 반납 횟수를 세고, 조건에 맞는 배지를 부여

**주요 특징**
- **부하율 계산**: `bikes_available / baseline_demand`
- **날짜/시간 함수**: `DAYOFWEEK()`, `HOUR()` 사용
- **NULL 처리**: `NULLIF()` 사용하여 0으로 나누기 방지

---

## SQL 기능 요약

### 사용된 SQL 기능들

1. **기본 DML**
   - `SELECT`, `INSERT`, `UPDATE`, `DELETE`

2. **JOIN**
   - `INNER JOIN`, `LEFT JOIN`

3. **집계 함수**
   - `COUNT(*)`, `COUNT(CASE ...)`, `SUM(CASE ...)`, `AVG()`

4. **GROUP BY**
   - 상태별, 날짜별, 지역별 그룹화

5. **서브쿼리**
   - 스칼라 서브쿼리, EXISTS 서브쿼리

6. **CTE (Common Table Expression)**
   - `WITH ... AS` 구문

7. **윈도우 함수**
   - `ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)`

8. **조건문**
   - `CASE ... WHEN ... THEN ... ELSE ... END`
   - `COALESCE()`, `NULLIF()`

9. **날짜 함수**
   - `DATE()`, `DATE_SUB()`, `NOW()`, `DAYOFWEEK()`, `HOUR()`

10. **FULLTEXT 검색**
    - `MATCH() AGAINST()`

11. **페이징**
    - `LIMIT`, `OFFSET`

12. **정렬**
    - `ORDER BY`

13. **VIEW**
    - `CREATE OR REPLACE VIEW`

14. **TRIGGER**
    - `CREATE TRIGGER ... AFTER UPDATE/INSERT`

15. **프로시저 로직**
    - `DELIMITER`, `BEGIN ... END`, `IF ... THEN ... END IF`
    - `DECLARE`, `SET`, `SELECT ... INTO`

---

## Prepared Statement 사용

모든 쿼리는 **Prepared Statement**를 사용하여 SQL Injection을 방지합니다.

- `pool.execute(query, [params])` 형식 사용
- 모든 사용자 입력은 `?` 플레이스홀더로 처리
- 파라미터는 배열로 전달

---

## 인덱스 활용

다음 컬럼들에 인덱스가 설정되어 있어 쿼리 성능이 최적화됩니다:

- `users.email`, `users.role`, `users.is_active`
- `stations.area_id`, `stations.is_active`
- `station_status.station_id`, `station_status.snapshot_ts`
- `station_baseline.station_id`, `station_baseline.dow`, `station_baseline.hour`
- `bikes.station_id`, `bikes.status`
- `fault_reports.reporter_id`, `fault_reports.status`
- `favorites.user_id`, `favorites.station_id`
- `posts.author_id`, `posts.created_at`, `posts.title`, `posts.body` (FULLTEXT)
- `comments.post_id`
- `likes.post_id`, `likes.user_id`
