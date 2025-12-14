# SD (Ddarungi) Insight

서울 공공자전거 대여소 실시간 현황 시각화 및 관리 시스템

## 프로젝트 구조

```
DBV-project3/
├── server/          # Node.js + Express 백엔드
├── client/          # Next.js 프론트엔드
├── db/              # 데이터베이스 DDL 및 시드 데이터
│   └── init/
│       ├── 01_schema.sql
│       └── 02_seed.sql
└── docker-compose.yml
```

## 기술 스택

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Chart.js
- **Backend**: Node.js, Express, MySQL2
- **Database**: MySQL 8.0
- **Authentication**: Session-based (express-session)
- **Container**: Docker Compose

## 실행 방법

### 1. 환경 설정

#### Windows / macOS

```bash
# 프로젝트 루트에서
# 1. Docker Compose로 MySQL 시작
docker-compose up -d

# 2. 백엔드 설정
cd server
cp .env.example .env
# .env 파일을 열어서 필요시 수정
npm install
npm run dev

# 3. 프론트엔드 설정 (새 터미널)
cd client
cp .env.example .env.local
# .env.local 파일을 열어서 필요시 수정
npm install
npm run dev
```

### 2. 데이터베이스 초기화

Docker Compose가 시작되면 자동으로 `db/init/` 디렉토리의 SQL 파일들이 실행됩니다.

수동으로 실행하려면:

```bash
# MySQL 컨테이너에 접속
docker exec -it ddarungi-mysql mysql -u ddarungi_user -pddarungi_pass ddarungi_db

# 또는 Adminer 사용 (http://localhost:8080)
# 서버: mysql
# 사용자: ddarungi_user
# 비밀번호: ddarungi_pass
# 데이터베이스: ddarungi_db
```

### 3. 기본 계정

시드 데이터에 포함된 계정:
- **관리자**: `admin@ddarungi.com` / `password123`
- **사용자1**: `user1@ddarungi.com` / `password123`
- **사용자2**: `user2@ddarungi.com` / `password123`

> **참고**: 시드 데이터의 비밀번호 해시는 실제 bcrypt 해시가 아닙니다. 
> 처음 실행 시 회원가입을 통해 새 계정을 만들거나, 
> MySQL에 직접 접속하여 비밀번호를 업데이트하세요.

### 4. 접속 URL

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:3001
- **Adminer (DB 관리)**: http://localhost:8080

## API 문서

### 인증 (Authentication)

#### POST /api/auth/register
회원가입
```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "사용자"
}
```

#### POST /api/auth/login
로그인
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST /api/auth/logout
로그아웃 (인증 필요)

#### GET /api/auth/me
현재 사용자 정보 (인증 필요)

### 대여소 (Stations)

#### GET /api/stations
모든 대여소 목록

#### GET /api/stations/nearby?lat=37.5665&lng=126.9780&radius=1
현재 위치 기준 주변 대여소 검색

#### GET /api/stations/:id
대여소 상세 정보

### 즐겨찾기 (Favorites)

#### GET /api/favorites
내 즐겨찾기 목록 (인증 필요)

#### POST /api/favorites
즐겨찾기 추가 (인증 필요)
```json
{
  "stationId": 1
}
```

#### DELETE /api/favorites/:stationId
즐겨찾기 삭제 (인증 필요)

### 고장 신고 (Reports)

#### POST /api/reports
고장 신고 제출 (인증 필요, multipart/form-data)
- stationId: 대여소 ID
- bikeId: 자전거 ID (선택)
- category: 카테고리
- content: 내용
- photo: 사진 파일 (선택)

#### GET /api/reports/mine
내 신고 목록 (인증 필요)

#### GET /api/reports/:id
신고 상세 (인증 필요)

### 커뮤니티 (Community)

#### GET /api/community?page=1&limit=10&search=검색어
게시글 목록

#### GET /api/community/:id
게시글 상세

#### POST /api/community
게시글 작성 (인증 필요)
```json
{
  "title": "제목",
  "body": "내용",
  "imageUrl": "이미지 URL (선택)"
}
```

#### PUT /api/community/:id
게시글 수정 (인증 필요, 작성자만)

#### DELETE /api/community/:id
게시글 삭제 (인증 필요, 작성자만)

#### POST /api/community/:id/comments
댓글 작성 (인증 필요)
```json
{
  "body": "댓글 내용"
}
```

#### POST /api/community/:id/like
좋아요 토글 (인증 필요)

### 마이페이지 (My Page)

#### GET /api/mypage
마이페이지 데이터 (인증 필요)
- 프로필, 대여 내역, 즐겨찾기, 신고 내역, 배지, 알림

#### PUT /api/mypage/alerts/:id/read
알림 읽음 처리 (인증 필요)

### 관리자 (Admin)

#### GET /api/admin/users
회원 목록 (관리자만)

#### PUT /api/admin/users/:id/role
회원 역할 변경 (관리자만)
```json
{
  "role": "ADMIN" | "USER"
}
```

#### PUT /api/admin/users/:id/active
회원 활성/비활성 (관리자만)
```json
{
  "isActive": true | false
}
```

#### GET /api/admin/stations
대여소 목록 (관리자만)

#### POST /api/admin/stations
대여소 생성 (관리자만)
```json
{
  "areaId": 1,
  "stationName": "대여소 이름",
  "latitude": 37.5665,
  "longitude": 126.9780,
  "docksTotal": 20
}
```

#### PUT /api/admin/stations/:id
대여소 수정 (관리자만)

#### GET /api/admin/bikes
자전거 목록 (관리자만)

#### POST /api/admin/bikes
자전거 생성 (관리자만)

#### PUT /api/admin/bikes/:id
자전거 수정 (관리자만)
```json
{
  "stationId": 1,
  "status": "AVAILABLE" | "IN_USE" | "FAULT" | "MAINTENANCE"
}
```

#### GET /api/admin/reports
신고 목록 (관리자만)

#### POST /api/admin/reports/:id/maintenance
유지보수 배정 (관리자만)
```json
{
  "assigneeId": 1,
  "priority": 0,
  "dueDate": "2024-01-20"
}
```

#### PUT /api/admin/reports/:id/validate
신고 검증 (관리자만)
```json
{
  "isValid": true | false
}
```

#### GET /api/admin/rebalancing
재배치 추천 (관리자만)

#### GET /api/admin/stats
통계 대시보드 (관리자만)

## 데이터베이스 스키마

### 주요 테이블

- `users`: 사용자 정보
- `areas`: 지역 정보
- `stations`: 대여소 정보
- `station_status`: 대여소 상태 스냅샷
- `station_baseline`: 대여소 기준 수요 (요일/시간별)
- `bikes`: 자전거 정보
- `rentals`: 대여 내역
- `fault_reports`: 고장 신고
- `maintenance_orders`: 유지보수 주문
- `favorites`: 즐겨찾기
- `achievement_defs`: 배지 정의
- `user_achievements`: 사용자 배지
- `alerts`: 알림
- `posts`: 커뮤니티 게시글
- `comments`: 댓글
- `likes`: 좋아요

### SQL 기능 활용

프로젝트에서 다양한 SQL 기능을 활용합니다:

1. **JOIN**: Inner Join, Left Join
2. **Aggregation**: COUNT, AVG, GROUP BY, HAVING
3. **Subqueries**: IN, EXISTS
4. **CTE (Common Table Expression)**: 최신 상태 조회
5. **VIEW**: latest_station_status
6. **Trigger**: 배지 자동 부여 (fault_reports 업데이트 시)

예시 쿼리:

```sql
-- CTE를 사용한 최신 상태 조회
WITH latest_status AS (
  SELECT station_id, bikes_available, snapshot_ts,
         ROW_NUMBER() OVER (PARTITION BY station_id ORDER BY snapshot_ts DESC) as rn
  FROM station_status
)
SELECT s.*, ls.bikes_available
FROM stations s
LEFT JOIN latest_status ls ON s.station_id = ls.station_id AND ls.rn = 1;

-- Aggregation with HAVING
SELECT 
  CASE 
    WHEN bikes_available < 3 THEN 'LOW'
    WHEN bikes_available < 10 THEN 'MEDIUM'
    ELSE 'HIGH'
  END as level,
  COUNT(*) as count
FROM stations s
LEFT JOIN latest_station_status ls ON s.station_id = ls.station_id
WHERE s.is_active = TRUE
GROUP BY level;

-- Subquery with EXISTS
SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM rentals r
  WHERE r.user_id = u.user_id
  AND r.start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
);
```

## 프론트엔드 페이지

### 사용자 페이지

- `/` - 메인 (지도 + 대여소 목록)
- `/login` - 로그인
- `/register` - 회원가입
- `/station/[id]` - 대여소 상세
- `/favorites` - 즐겨찾기
- `/reports/new` - 고장 신고 작성
- `/reports/mine` - 내 신고 목록
- `/community` - 커뮤니티 목록
- `/community/[id]` - 게시글 상세
- `/community/new` - 게시글 작성
- `/mypage` - 마이페이지

### 관리자 페이지

- `/admin` - 관리자 대시보드
- `/admin/users` - 회원 관리
- `/admin/stations` - 대여소 관리
- `/admin/bikes` - 자전거 관리
- `/admin/reports` - 신고 관리
- `/admin/rebalancing` - 재배치 추천

## 기능 체크리스트

### 사용자 기능

- [x] 현재 위치 기반 대여소 탐색 (지오로케이션)
- [x] 반경 조절 가능한 주변 대여소 검색
- [x] 거리순 정렬 및 목록 표시
- [x] 대여소 상태 시각화 (대여 가능/반납 가능)
- [x] 기준 수요 대비 부하율 계산 및 색상 코딩
- [x] 대여소 상세 페이지 (차트 포함)
- [x] 즐겨찾기 추가/삭제
- [x] 즐겨찾기 페이지
- [x] 고장 신고 제출 (카테고리, 내용, 사진)
- [x] 내 신고 목록 및 상태 확인
- [x] 배지 자동 부여 (트리거)
- [x] 커뮤니티 게시글 CRUD
- [x] 댓글 작성/조회
- [x] 좋아요 토글
- [x] 조회수 카운트
- [x] 게시글 검색
- [x] 마이페이지 (프로필, 대여 내역, 즐겨찾기, 신고, 배지, 알림)

### 관리자 기능

- [x] 회원 관리 (목록, 역할 변경, 활성/비활성)
- [x] 대여소 관리 (생성, 수정, 도크 수 변경, 활성/비활성)
- [x] 자전거 관리 (생성, 상태 변경, 대여소 배정)
- [x] 신고 관리 (목록, 유지보수 배정, 검증)
- [x] 유지보수 주문 관리 (배정, 상태 업데이트, 우선순위, 마감일)
- [x] 재배치 추천 (자동 제안 알고리즘)
- [x] 통계 대시보드 (Chart.js 사용)
  - [x] 최근 7일 대여 통계
  - [x] 신고 상태별 통계
  - [x] 유지보수 상태별 통계
  - [x] 대여소 혼잡도 통계

### 기타 기능

- [x] 세션 기반 인증
- [x] 역할 기반 접근 제어 (USER/ADMIN)
- [x] 알림 시스템 (신고 검증, 유지보수 상태 변경)
- [x] 알림 읽음 처리

## 환경 변수

### Server (.env)

```env
PORT=3001
NODE_ENV=development
SESSION_SECRET=your-secret-key-change-in-production

DB_HOST=localhost
DB_PORT=3306
DB_USER=ddarungi_user
DB_PASSWORD=ddarungi_pass
DB_NAME=ddarungi_db

CLIENT_URL=http://localhost:3000
```

### Client (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 문제 해결

### MySQL 연결 오류

```bash
# 컨테이너 상태 확인
docker ps

# MySQL 로그 확인
docker logs ddarungi-mysql

# 컨테이너 재시작
docker-compose restart mysql
```

### 포트 충돌

`docker-compose.yml`에서 포트를 변경하거나, 기존 서비스를 중지하세요.

### 세션 문제

`.env` 파일의 `SESSION_SECRET`을 변경하고 서버를 재시작하세요.

## 개발 참고사항

- 백엔드는 ORM 없이 순수 MySQL2를 사용합니다.
- 모든 쿼리는 파라미터화된 쿼리를 사용합니다 (SQL Injection 방지).
- 프론트엔드는 Next.js App Router를 사용합니다.
- CORS는 개발 환경에서 `http://localhost:3000`을 허용합니다.

## 라이선스

MIT

