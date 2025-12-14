# 주요 SQL 예시 및 설명

## 실제 코드에서 사용한 SQL 쿼리 정리

---

## (1) 사용자 인증 및 조회 (SELECT + WHERE)

### 목적
- 회원가입 시 이메일 중복 확인
- 로그인 시 사용자 정보 조회
- 현재 로그인한 사용자 정보 조회

### SQL 예시

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

### 사용 위치
- `server/routes/auth.js`
  - `POST /api/auth/register` (라인 18-21)
  - `POST /api/auth/login` (라인 65-68)
  - `GET /api/auth/me` (라인 118-121)

### 사용 테이블
- `users`

---

## (2) 사용자 등록 (INSERT)

### 목적
- 새 사용자 회원가입

### SQL 예시

```sql
INSERT INTO users (email, password_hash, nickname, role) 
VALUES (?, ?, ?, ?)
```

### 사용 위치
- `server/routes/auth.js`
  - `POST /api/auth/register` (라인 31-34)

### 사용 테이블
- `users`

---

## (3) 대여소 목록 조회 (SELECT + JOIN + 서브쿼리)

### 목적
- 활성 대여소 목록 조회 (지역 정보 포함)
- 각 대여소의 현재 대여 가능 자전거 수 계산

### SQL 예시

```sql
SELECT s.*, a.area_name,
       (SELECT COUNT(*) FROM bikes 
        WHERE station_id = s.station_id 
        AND status IN ('AVAILABLE', 'FAULT')) as bikes_available
FROM stations s
INNER JOIN areas a ON s.area_id = a.area_id
WHERE s.is_active = TRUE
```

### 사용 위치
- `server/routes/stations.js`
  - `GET /api/stations/nearby` (라인 33-41)
  - `GET /api/stations` (라인 132-140)
  - `server/routes/admin.js`
  - `GET /api/admin/stations` (라인 69-77)

### 사용 테이블
- `stations`
- `areas`
- `bikes`

---

## (4) 기준 수요 조회 (SELECT + 다중 조건)

### 목적
- 현재 요일/시간대의 기준 수요 조회
- 부하율 계산을 위한 기준값 제공

### SQL 예시

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

### 사용 위치
- `server/routes/stations.js`
  - `GET /api/stations/nearby` (라인 80-98)
  - `GET /api/stations/:id` (라인 271-280)
  - `GET /api/stations/congestion/all` (라인 176-181)
  - `server/routes/admin.js`
  - `GET /api/admin/stations/utilization` (라인 427-436)

### 사용 테이블
- `station_baseline`

---

## (5) 대여소 상세 정보 조회 (SELECT + JOIN + 집계)

### 목적
- 특정 대여소의 상세 정보 조회
- 대여소의 자전거 목록 및 상태 조회
- 대여소 상태 이력 조회

### SQL 예시

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

### 사용 위치
- `server/routes/stations.js`
  - `GET /api/stations/:id` (라인 234-307)

### 사용 테이블
- `stations`
- `areas`
- `bikes`
- `station_status`
- `station_baseline`

---

## (6) 신고 처리 현황 (집계 + GROUP BY)

### 목적
- 관리자 대시보드: RECEIVED/IN_PROGRESS/DONE 등 상태별 분포 차트

### SQL 예시

```sql
SELECT status, COUNT(*) as count
FROM fault_reports
GROUP BY status
```

### 사용 위치
- `server/routes/admin.js`
  - `GET /api/admin/stats` (라인 479-483)

### 사용 테이블
- `fault_reports`

---

## (7) 유지보수 상태별 분포 (집계 + GROUP BY)

### 목적
- 관리자 대시보드: 유지보수 주문 상태별 분포 차트

### SQL 예시

```sql
SELECT status, COUNT(*) as count
FROM maintenance_orders
GROUP BY status
```

### 사용 위치
- `server/routes/admin.js`
  - `GET /api/admin/stats` (라인 486-490)

### 사용 테이블
- `maintenance_orders`

---

## (8) 대여소 혼잡도 분포 (CTE + 윈도우 함수 + CASE + GROUP BY)

### 목적
- 관리자 대시보드: 대여소 혼잡도 수준별 분포 차트

### SQL 예시

```sql
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
```

### 사용 위치
- `server/routes/admin.js`
  - `GET /api/admin/stats` (라인 493-510)

### 사용 테이블
- `stations`
- `station_status`

---

## (9) 최근 7일 대여 통계 (날짜별 집계 + GROUP BY)

### 목적
- 관리자 대시보드: 최근 7일간 일별 대여 건수 차트

### SQL 예시

```sql
SELECT DATE(start_time) as date, COUNT(*) as count
FROM rentals
WHERE start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(start_time)
ORDER BY date ASC
```

### 사용 위치
- `server/routes/admin.js`
  - `GET /api/admin/stats` (라인 470-476)

### 사용 테이블
- `rentals`

---

## (10) 재배치 추천 (CTE + 윈도우 함수 + 서브쿼리)

### 목적
- 관리자: 자전거가 부족한 대여소와 여유 있는 대여소 식별 및 재배치 제안

### SQL 예시

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

### 사용 위치
- `server/routes/admin.js`
  - `GET /api/admin/rebalancing` (라인 342-355)

### 사용 테이블
- `stations`
- `station_status`

---

## (11) 대여소 이용률 지도 (CTE + 윈도우 함수 + JOIN)

### 목적
- 관리자: 각 대여소의 평소 이용률 대비 현재 자전거 배치율 계산 및 색상 표시

### SQL 예시

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

### 사용 위치
- `server/routes/admin.js`
  - `GET /api/admin/stations/utilization` (라인 409-422)

### 사용 테이블
- `stations`
- `station_status`

---

## (12) 커뮤니티 게시글 목록 (JOIN + 서브쿼리 + FULLTEXT 검색 + 페이징)

### 목적
- 커뮤니티 게시글 목록 조회 (작성자 정보, 댓글 수, 좋아요 수 포함)
- 제목/내용 검색 기능
- 페이징 처리

### SQL 예시

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

### 사용 위치
- `server/routes/community.js`
  - `GET /api/community` (라인 13-43)

### 사용 테이블
- `posts`
- `users`
- `comments`
- `likes`

---

## (13) 게시글 상세 조회 (JOIN + 서브쿼리 + UPDATE)

### 목적
- 게시글 상세 정보 조회
- 조회수 증가
- 댓글 목록 조회
- 좋아요 수 및 현재 사용자 좋아요 여부 확인

### SQL 예시

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

### 사용 위치
- `server/routes/community.js`
  - `GET /api/community/:id` (라인 65-109)

### 사용 테이블
- `posts`
- `users`
- `comments`
- `likes`

---

## (14) 게시글 작성 (INSERT)

### 목적
- 새 게시글 작성

### SQL 예시

```sql
INSERT INTO posts (author_id, title, body, image_url) 
VALUES (?, ?, ?, ?)
```

### 사용 위치
- `server/routes/community.js`
  - `POST /api/community` (라인 131-134)

### 사용 테이블
- `posts`

---

## (15) 게시글 수정 (UPDATE + 소유권 확인)

### 목적
- 게시글 수정 (작성자만 가능)

### SQL 예시

```sql
-- 소유권 확인
SELECT author_id FROM posts WHERE post_id = ?

-- 게시글 수정
UPDATE posts SET title = ?, body = ?, image_url = ? 
WHERE post_id = ?
```

### 사용 위치
- `server/routes/community.js`
  - `PUT /api/community/:id` (라인 152-168)

### 사용 테이블
- `posts`

---

## (16) 게시글 삭제 (DELETE + 소유권 확인)

### 목적
- 게시글 삭제 (작성자 또는 관리자만 가능)

### SQL 예시

```sql
-- 소유권 확인
SELECT author_id FROM posts WHERE post_id = ?

-- 게시글 삭제
DELETE FROM posts WHERE post_id = ?
```

### 사용 위치
- `server/routes/community.js`
  - `DELETE /api/community/:id` (라인 186-199)

### 사용 테이블
- `posts`

---

## (17) 댓글 작성 (INSERT)

### 목적
- 게시글에 댓글 작성

### SQL 예시

```sql
INSERT INTO comments (post_id, author_id, body) 
VALUES (?, ?, ?)
```

### 사용 위치
- `server/routes/community.js`
  - `POST /api/community/:id/comments` (라인 227-230)

### 사용 테이블
- `comments`

---

## (18) 좋아요 토글 (INSERT/DELETE)

### 목적
- 게시글 좋아요/좋아요 취소

### SQL 예시

```sql
-- 좋아요 여부 확인
SELECT like_id FROM likes WHERE post_id = ? AND user_id = ?

-- 좋아요 추가
INSERT INTO likes (post_id, user_id) VALUES (?, ?)

-- 좋아요 취소
DELETE FROM likes WHERE post_id = ? AND user_id = ?
```

### 사용 위치
- `server/routes/community.js`
  - `POST /api/community/:id/like` (라인 247-266)

### 사용 테이블
- `likes`

---

## (19) 고장 신고 작성 (INSERT + 서브쿼리)

### 목적
- 고장 신고 접수
- 관리자에게 알림 생성

### SQL 예시

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

### 사용 위치
- `server/routes/reports.js`
  - `POST /api/reports` (라인 36-60)

### 사용 테이블
- `stations`
- `fault_reports`
- `users`
- `alerts`

---

## (20) 내 신고 목록 조회 (JOIN + WHERE)

### 목적
- 현재 사용자가 작성한 고장 신고 목록 조회

### SQL 예시

```sql
SELECT r.*, s.station_name, b.bike_id as bike_number
FROM fault_reports r
LEFT JOIN stations s ON r.station_id = s.station_id
LEFT JOIN bikes b ON r.bike_id = b.bike_id
WHERE r.reporter_id = ?
ORDER BY r.created_at DESC
```

### 사용 위치
- `server/routes/reports.js`
  - `GET /api/reports/mine` (라인 74-82)

### 사용 테이블
- `fault_reports`
- `stations`
- `bikes`

---

## (21) 즐겨찾기 목록 조회 (JOIN + 서브쿼리)

### 목적
- 사용자의 즐겨찾기 대여소 목록 조회

### SQL 예시

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

### 사용 위치
- `server/routes/favorites.js`
  - `GET /api/favorites` (라인 10-24)

### 사용 테이블
- `favorites`
- `stations`
- `areas`
- `station_status`

---

## (22) 즐겨찾기 추가 (INSERT + 중복 확인)

### 목적
- 대여소를 즐겨찾기에 추가

### SQL 예시

```sql
-- 대여소 존재 확인
SELECT station_id FROM stations WHERE station_id = ?

-- 즐겨찾기 중복 확인
SELECT fav_id FROM favorites WHERE user_id = ? AND station_id = ?

-- 즐겨찾기 추가
INSERT INTO favorites (user_id, station_id) VALUES (?, ?)
```

### 사용 위치
- `server/routes/favorites.js`
  - `POST /api/favorites` (라인 42-65)

### 사용 테이블
- `favorites`
- `stations`

---

## (23) 즐겨찾기 삭제 (DELETE)

### 목적
- 즐겨찾기에서 대여소 제거

### SQL 예시

```sql
DELETE FROM favorites WHERE user_id = ? AND station_id = ?
```

### 사용 위치
- `server/routes/favorites.js`
  - `DELETE /api/favorites/:stationId` (라인 78-81)

### 사용 테이블
- `favorites`

---

## (24) 마이페이지 데이터 조회 (다중 JOIN + 서브쿼리)

### 목적
- 사용자 프로필, 대여 이력, 즐겨찾기, 신고 목록, 배지, 알림 조회

### SQL 예시

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

### 사용 위치
- `server/routes/mypage.js`
  - `GET /api/mypage` (라인 13-75)

### 사용 테이블
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

## (25) 관리자 - 회원 목록 조회 (서브쿼리 + 집계)

### 목적
- 관리자: 전체 회원 목록 조회 (대여 횟수, 신고 횟수 포함)

### SQL 예시

```sql
SELECT user_id, email, nickname, role, is_active, created_at,
       (SELECT COUNT(*) FROM rentals WHERE user_id = u.user_id) as rental_count,
       (SELECT COUNT(*) FROM fault_reports WHERE reporter_id = u.user_id) as report_count
FROM users u
ORDER BY u.created_at DESC
```

### 사용 위치
- `server/routes/admin.js`
  - `GET /api/admin/users` (라인 12-18)

### 사용 테이블
- `users`
- `rentals`
- `fault_reports`

---

## (26) 관리자 - 회원 역할 변경 (UPDATE)

### 목적
- 관리자: 회원 역할 변경 (USER ↔ ADMIN)

### SQL 예시

```sql
UPDATE users SET role = ? WHERE user_id = ?
```

### 사용 위치
- `server/routes/admin.js`
  - `PUT /api/admin/users/:id/role` (라인 36-39)

### 사용 테이블
- `users`

---

## (27) 관리자 - 회원 활성화/비활성화 (UPDATE)

### 목적
- 관리자: 회원 계정 활성화/비활성화

### SQL 예시

```sql
UPDATE users SET is_active = ? WHERE user_id = ?
```

### 사용 위치
- `server/routes/admin.js`
  - `PUT /api/admin/users/:id/active` (라인 53-56)

### 사용 테이블
- `users`

---

## (28) 관리자 - 대여소 생성 (INSERT)

### 목적
- 관리자: 새 대여소 생성

### SQL 예시

```sql
INSERT INTO stations (area_id, station_name, latitude, longitude, docks_total) 
VALUES (?, ?, ?, ?, ?)
```

### 사용 위치
- `server/routes/admin.js`
  - `POST /api/admin/stations` (라인 99-102)

### 사용 테이블
- `stations`

---

## (29) 관리자 - 대여소 수정 (UPDATE)

### 목적
- 관리자: 대여소 정보 수정

### SQL 예시

```sql
UPDATE stations 
SET station_name = ?, latitude = ?, longitude = ?, docks_total = ?, is_active = ? 
WHERE station_id = ?
```

### 사용 위치
- `server/routes/admin.js`
  - `PUT /api/admin/stations/:id` (라인 116-119)

### 사용 테이블
- `stations`

---

## (30) 관리자 - 대여소 활성화/비활성화 (UPDATE)

### 목적
- 관리자: 대여소 활성화/비활성화

### SQL 예시

```sql
UPDATE stations SET is_active = ? WHERE station_id = ?
```

### 사용 위치
- `server/routes/admin.js`
  - `PUT /api/admin/stations/:id/active` (라인 133-136)

### 사용 테이블
- `stations`

---

## (31) 관리자 - 자전거 목록 조회 (JOIN)

### 목적
- 관리자: 전체 자전거 목록 조회 (대여소 정보 포함)

### SQL 예시

```sql
SELECT b.*, s.station_name, a.area_name
FROM bikes b
LEFT JOIN stations s ON b.station_id = s.station_id
LEFT JOIN areas a ON s.area_id = a.area_id
ORDER BY b.bike_id
```

### 사용 위치
- `server/routes/admin.js`
  - `GET /api/admin/bikes` (라인 149-155)

### 사용 테이블
- `bikes`
- `stations`
- `areas`

---

## (32) 관리자 - 자전거 생성 (INSERT)

### 목적
- 관리자: 새 자전거 등록

### SQL 예시

```sql
INSERT INTO bikes (station_id, status, purchased_at) 
VALUES (?, ?, ?)
```

### 사용 위치
- `server/routes/admin.js`
  - `POST /api/admin/bikes` (라인 168-171)

### 사용 테이블
- `bikes`

---

## (33) 관리자 - 자전거 수정 (UPDATE)

### 목적
- 관리자: 자전거 상태 및 대여소 변경

### SQL 예시

```sql
UPDATE bikes SET station_id = ?, status = ? WHERE bike_id = ?
```

### 사용 위치
- `server/routes/admin.js`
  - `PUT /api/admin/bikes/:id` (라인 185-188)

### 사용 테이블
- `bikes`

---

## (34) 관리자 - 신고 목록 조회 (다중 JOIN)

### 목적
- 관리자: 전체 고장 신고 목록 조회 (신고자, 대여소, 유지보수 정보 포함)

### SQL 예시

```sql
SELECT r.*, u.nickname as reporter_name, s.station_name,
       m.order_id, m.status as maintenance_status, m.priority, m.due_date
FROM fault_reports r
LEFT JOIN users u ON r.reporter_id = u.user_id
LEFT JOIN stations s ON r.station_id = s.station_id
LEFT JOIN maintenance_orders m ON r.report_id = m.report_id
ORDER BY r.created_at DESC
```

### 사용 위치
- `server/routes/admin.js`
  - `GET /api/admin/reports` (라인 201-209)

### 사용 테이블
- `fault_reports`
- `users`
- `stations`
- `maintenance_orders`

---

## (35) 관리자 - 유지보수 주문 생성 (INSERT + UPDATE)

### 목적
- 관리자: 고장 신고에 대한 유지보수 주문 생성 및 신고 상태 업데이트

### SQL 예시

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

### 사용 위치
- `server/routes/admin.js`
  - `POST /api/admin/reports/:id/maintenance` (라인 228-260)

### 사용 테이블
- `maintenance_orders`
- `fault_reports`
- `alerts`

---

## (36) 관리자 - 유지보수 주문 수정 (UPDATE)

### 목적
- 관리자: 유지보수 주문 상태, 우선순위, 기한 수정

### SQL 예시

```sql
-- 유지보수 주문 수정
UPDATE maintenance_orders 
SET status = ?, priority = ?, due_date = ? 
WHERE order_id = ?

-- 완료 시 신고 상태 업데이트
UPDATE fault_reports SET status = ? WHERE report_id = ?
```

### 사용 위치
- `server/routes/admin.js`
  - `PUT /api/admin/maintenance/:id` (라인 274-292)

### 사용 테이블
- `maintenance_orders`
- `fault_reports`

---

## (37) 관리자 - 신고 검증 (UPDATE + INSERT)

### 목적
- 관리자: 고장 신고 검증 및 배지 부여 트리거 활성화

### SQL 예시

```sql
-- 신고 검증
UPDATE fault_reports 
SET is_valid = ?, validated_at = NOW(), status = ? 
WHERE report_id = ?

-- 신고자에게 알림 생성
INSERT INTO alerts (user_id, type, ref_id, message) 
VALUES (?, ?, ?, ?)
```

### 사용 위치
- `server/routes/admin.js`
  - `PUT /api/admin/reports/:id/validate` (라인 306-325)

### 사용 테이블
- `fault_reports`
- `alerts`

---

## (38) 지역별 대여소 수 (집계 + GROUP BY)

### 목적
- 관리자 대시보드: 지역별 대여소 수 통계

### SQL 예시

```sql
SELECT a.area_name, COUNT(*) as count
FROM stations s
INNER JOIN areas a ON s.area_id = a.area_id
WHERE s.is_active = TRUE
GROUP BY a.area_id, a.area_name
```

### 사용 위치
- `server/routes/admin.js`
  - `GET /api/admin/stats` (라인 528-534)

### 사용 테이블
- `stations`
- `areas`

---

## (39) 자전거 상태별 분포 (집계 + GROUP BY)

### 목적
- 관리자 대시보드: 자전거 상태별 분포 통계

### SQL 예시

```sql
SELECT status, COUNT(*) as count
FROM bikes
GROUP BY status
```

### 사용 위치
- `server/routes/admin.js`
  - `GET /api/admin/stats` (라인 546-550)

### 사용 테이블
- `bikes`

---

## (40) 최근 7일 신고 통계 (날짜별 집계 + GROUP BY)

### 목적
- 관리자 대시보드: 최근 7일간 일별 신고 건수 통계

### SQL 예시

```sql
SELECT DATE(created_at) as date, COUNT(*) as count
FROM fault_reports
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY date ASC
```

### 사용 위치
- `server/routes/admin.js`
  - `GET /api/admin/stats` (라인 537-543)

### 사용 테이블
- `fault_reports`

---

## (41) 전체 사용자 및 활성 사용자 수 (집계 + CASE)

### 목적
- 관리자 대시보드: 전체 사용자 수 및 활성 사용자 수 통계

### SQL 예시

```sql
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_users
FROM users
```

### 사용 위치
- `server/routes/admin.js`
  - `GET /api/admin/stats` (라인 513-518)

### 사용 테이블
- `users`

---

## (42) 혼잡도 예측 (SELECT + JOIN + 계산)

### 목적
- 사용자: 특정 시간대의 대여소 혼잡도 예측

### SQL 예시

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

### 사용 위치
- `server/routes/stations.js`
  - `GET /api/stations/congestion/all` (라인 164-181)

### 사용 테이블
- `stations`
- `areas`
- `bikes`
- `station_baseline`

---

## (43) 알림 읽음 처리 (UPDATE)

### 목적
- 사용자: 알림을 읽음으로 표시

### SQL 예시

```sql
UPDATE alerts SET is_read = TRUE 
WHERE alert_id = ? AND user_id = ?
```

### 사용 위치
- `server/routes/mypage.js`
  - `PUT /api/mypage/alerts/:id/read` (라인 95-98)

### 사용 테이블
- `alerts`

---

## (44) 특정 대여소의 자전거 목록 조회 (SELECT + WHERE + LIMIT)

### 목적
- 고장 신고 시: 선택한 대여소의 자전거 목록 조회

### SQL 예시

```sql
SELECT bike_id, status 
FROM bikes 
WHERE station_id = ? 
AND status IN ('AVAILABLE', 'FAULT')
```

### 사용 위치
- `server/routes/reports.js` (추정)
  - `GET /api/reports/bikes/:stationId` (라인 없음, 추가 필요)

### 사용 테이블
- `bikes`

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
   - `DATE()`, `DATE_SUB()`, `NOW()`

10. **FULLTEXT 검색**
    - `MATCH() AGAINST()`

11. **페이징**
    - `LIMIT`, `OFFSET`

12. **정렬**
    - `ORDER BY`

13. **집계 조건**
    - `HAVING` (사용되지 않았지만 가능)

14. **UNION** (사용되지 않았지만 가능)

15. **VIEW** (스키마에 정의되어 있지만 쿼리에서 직접 사용되지 않음)

16. **TRIGGER** (스키마에 정의되어 있지만 쿼리에서 직접 호출되지 않음)

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
- `posts.author_id`, `posts.created_at`
- `comments.post_id`
- `likes.post_id`, `likes.user_id`

