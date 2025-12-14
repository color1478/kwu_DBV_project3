# 웹 애플리케이션 구현 및 데이터 시각화 가이드

## 계산식 및 SQL 정리

---

## 1. 주요 계산식

### 1.1 거리 계산 (Haversine Formula)

#### 목적
- 사용자 현재 위치와 대여소 간의 거리 계산
- 반경 내 대여소 필터링

#### 계산식

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // 거리 (km)
}
```

#### 수식 설명
- **Haversine 공식**: 구면 삼각법을 사용한 지구상 두 점 간의 거리 계산
- **R = 6371km**: 지구의 평균 반지름
- **결과**: 킬로미터 단위 거리

#### 사용 위치
- `server/routes/stations.js` (라인 8-17)
- `GET /api/stations/nearby` 엔드포인트

#### 사용 예시
```javascript
const distance = calculateDistance(
  37.5665, 126.9780,  // 사용자 위치 (서울시청)
  37.4980, 127.0276   // 대여소 위치 (강남역)
);
// 결과: 약 8.5km
```

---

### 1.2 부하율 계산 (Load Factor)

#### 목적
- 대여소의 자전거 공급 상태를 수치화
- 기준 수요 대비 현재 대여 가능 자전거 수의 비율
- 데이터 시각화 (색상 코딩)에 사용

#### 계산식

```javascript
loadFactor = bikes_available / baseline_demand
```

#### 수식 설명
- **bikes_available**: 현재 대여 가능한 자전거 수 (AVAILABLE + FAULT 상태)
- **baseline_demand**: 해당 요일/시간대의 기준 수요 (평균 대여 가능 수)
- **결과**: 
  - `loadFactor < 0.5`: 부족 (빨강)
  - `0.5 ≤ loadFactor < 0.8`: 보통 (주황/노랑)
  - `0.8 ≤ loadFactor ≤ 1.2`: 양호 (초록)
  - `loadFactor > 1.2`: 여유 (파랑)

#### 사용 위치
- `server/routes/stations.js` (라인 103)
- `server/routes/admin.js` (라인 441)
- `db/init/01_schema.sql` (트리거 내부, 라인 449)

#### 사용 예시
```javascript
const baseline = 10.0;  // 기준 수요
const bikesAvailable = 7;  // 현재 대여 가능 수
const loadFactor = bikesAvailable / baseline;  // 0.7 (보통)
```

#### 폴백 로직
```javascript
// 1순위: 현재 요일/시간대의 baseline
SELECT baseline_demand FROM station_baseline 
WHERE station_id = ? AND dow = ? AND hour = ?

// 2순위: 같은 요일의 가장 가까운 시간대
SELECT baseline_demand FROM station_baseline 
WHERE station_id = ? AND dow = ? 
ORDER BY ABS(hour - ?) LIMIT 1

// 3순위: 월요일 8시 baseline (기본값)
SELECT baseline_demand FROM station_baseline 
WHERE station_id = ? AND dow = 1 AND hour = 8 LIMIT 1

// 최종 폴백: 하드코딩된 기본값 10
const baseline = baselines.length > 0 ? parseFloat(baselines[0].baseline_demand) : 10;
```

---

### 1.3 반납 가능 도크 수 계산

#### 목적
- 대여소에 자전거를 반납할 수 있는 빈 도크 수 계산

#### 계산식

```javascript
docks_available = docks_total - bikes_available
```

#### 수식 설명
- **docks_total**: 대여소의 총 도크 수 (주차 슬롯)
- **bikes_available**: 현재 대여 가능한 자전거 수
- **docks_available**: 반납 가능한 빈 도크 수

#### 사용 위치
- `server/routes/stations.js` (라인 44-45, 142-144)
- `server/routes/admin.js` (라인 80-82)

#### 사용 예시
```javascript
const docksTotal = 20;  // 총 도크 수
const bikesAvailable = 7;  // 현재 자전거 수
const docksAvailable = docksTotal - bikesAvailable;  // 13개 (반납 가능)
```

---

### 1.4 이용률 계산 (Utilization Rate)

#### 목적
- 관리자: 대여소의 도크 이용률 계산
- 재배치 추천에 사용

#### 계산식

```sql
utilization_rate = bikes_available / docks_total
```

#### 수식 설명
- **bikes_available**: 현재 대여 가능한 자전거 수
- **docks_total**: 총 도크 수
- **결과**: 0.0 ~ 1.0 (0% ~ 100%)

#### SQL 예시

```sql
SELECT 
  s.station_id,
  s.docks_total,
  COALESCE(ls.bikes_available, 0) as bikes_available,
  (COALESCE(ls.bikes_available, 0) / NULLIF(s.docks_total, 0)) as utilization_rate
FROM stations s
LEFT JOIN latest_status ls ON s.station_id = ls.station_id
WHERE s.is_active = TRUE
```

#### 사용 위치
- `server/routes/admin.js` (라인 418)
- 재배치 추천 로직

#### NULL 처리
- `COALESCE()`: NULL을 0으로 변환
- `NULLIF()`: 0으로 나누기 방지

---

### 1.5 혼잡도 예측 계산

#### 목적
- 특정 시간대의 대여소 혼잡도 예측
- 사용자에게 최적 대여소 추천

#### 계산식

```javascript
predicted_load_factor = predicted_bikes_available / baseline_demand
```

#### 수식 설명
- **predicted_bikes_available**: 예측된 대여 가능 자전거 수 (현재는 현재값 사용)
- **baseline_demand**: 예측 시간대의 기준 수요
- **결과**: 부하율과 동일한 범위로 해석

#### 사용 위치
- `server/routes/stations.js` (라인 195)

#### 향후 개선
- 시계열 분석 (ARIMA, LSTM 등)
- 과거 패턴 기반 예측
- 시간대별 트렌드 반영

---

## 2. SQL JOIN 활용

### 2.1 INNER JOIN

#### 목적
- 두 테이블의 교집합만 조회
- 필수 관계가 있는 데이터만 반환

#### 예시 1: 대여소 목록 조회 (지역 정보 포함)

```sql
SELECT s.*, a.area_name
FROM stations s
INNER JOIN areas a ON s.area_id = a.area_id
WHERE s.is_active = TRUE
```

**설명**
- `stations`와 `areas`를 `area_id`로 조인
- 활성 대여소만 조회하며 지역명 포함

**사용 위치**
- `server/routes/stations.js` (라인 234-239)
- `server/routes/admin.js` (라인 69-77)

---

#### 예시 2: 게시글 목록 조회 (작성자 정보 포함)

```sql
SELECT p.*, u.nickname as author_name
FROM posts p
INNER JOIN users u ON p.author_id = u.user_id
ORDER BY p.created_at DESC
```

**설명**
- `posts`와 `users`를 `author_id`로 조인
- 작성자 닉네임 포함

**사용 위치**
- `server/routes/community.js` (라인 13-19)

---

### 2.2 LEFT JOIN

#### 목적
- 왼쪽 테이블의 모든 행을 포함
- 오른쪽 테이블에 매칭이 없어도 NULL로 반환

#### 예시 1: 대여 이력 조회 (시작/종료 대여소 정보)

```sql
SELECT r.*, 
       s1.station_name as start_station_name,
       s2.station_name as end_station_name
FROM rentals r
LEFT JOIN stations s1 ON r.start_station = s1.station_id
LEFT JOIN stations s2 ON r.end_station = s2.station_id
WHERE r.user_id = ?
ORDER BY r.start_time DESC
```

**설명**
- `rentals`의 모든 행을 포함
- `end_station`이 NULL인 경우(대여 중)도 포함
- 시작/종료 대여소명 포함

**사용 위치**
- `server/routes/mypage.js` (라인 25-36)

---

#### 예시 2: 신고 목록 조회 (대여소/자전거 정보)

```sql
SELECT r.*, s.station_name, b.bike_id as bike_number
FROM fault_reports r
LEFT JOIN stations s ON r.station_id = s.station_id
LEFT JOIN bikes b ON r.bike_id = b.bike_id
WHERE r.reporter_id = ?
ORDER BY r.created_at DESC
```

**설명**
- `bike_id`가 NULL인 경우(대여소만 신고)도 포함
- 대여소명과 자전거 ID 포함

**사용 위치**
- `server/routes/reports.js` (라인 74-82)

---

#### 예시 3: 관리자 신고 목록 (유지보수 정보 포함)

```sql
SELECT r.*, u.nickname as reporter_name, s.station_name,
       m.order_id, m.status as maintenance_status, m.priority, m.due_date
FROM fault_reports r
LEFT JOIN users u ON r.reporter_id = u.user_id
LEFT JOIN stations s ON r.station_id = s.station_id
LEFT JOIN maintenance_orders m ON r.report_id = m.report_id
ORDER BY r.created_at DESC
```

**설명**
- 유지보수 주문이 없는 신고도 포함
- 신고자, 대여소, 유지보수 정보 모두 포함

**사용 위치**
- `server/routes/admin.js` (라인 201-209)

---

### 2.3 서브쿼리를 활용한 JOIN

#### 목적
- 집계 결과를 메인 쿼리에 포함
- 복잡한 계산을 서브쿼리로 분리

#### 예시 1: 대여소 목록 (자전거 수 포함)

```sql
SELECT s.*, a.area_name,
       (SELECT COUNT(*) FROM bikes 
        WHERE station_id = s.station_id 
        AND status IN ('AVAILABLE', 'FAULT')) as bikes_available
FROM stations s
INNER JOIN areas a ON s.area_id = a.area_id
WHERE s.is_active = TRUE
```

**설명**
- 각 대여소별로 자전거 수를 서브쿼리로 계산
- 메인 쿼리와 함께 반환

**사용 위치**
- `server/routes/stations.js` (라인 33-41)
- `server/routes/admin.js` (라인 69-77)

---

#### 예시 2: 게시글 목록 (댓글 수, 좋아요 수 포함)

```sql
SELECT p.*, u.nickname as author_name,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.post_id) as comment_count,
       (SELECT COUNT(*) FROM likes WHERE post_id = p.post_id) as like_count
FROM posts p
INNER JOIN users u ON p.author_id = u.user_id
ORDER BY p.created_at DESC
```

**설명**
- 각 게시글별로 댓글 수와 좋아요 수를 서브쿼리로 계산
- 한 번의 쿼리로 모든 정보 조회

**사용 위치**
- `server/routes/community.js` (라인 13-19)

---

#### 예시 3: 회원 목록 (대여 횟수, 신고 횟수 포함)

```sql
SELECT user_id, email, nickname, role, is_active, created_at,
       (SELECT COUNT(*) FROM rentals WHERE user_id = u.user_id) as rental_count,
       (SELECT COUNT(*) FROM fault_reports WHERE reporter_id = u.user_id) as report_count
FROM users u
ORDER BY u.created_at DESC
```

**설명**
- 각 회원별로 대여 횟수와 신고 횟수를 서브쿼리로 계산
- 관리자 대시보드에 사용

**사용 위치**
- `server/routes/admin.js` (라인 12-18)

---

## 3. SELECT 쿼리 패턴

### 3.1 집계 함수 (Aggregation)

#### COUNT

```sql
-- 전체 개수
SELECT COUNT(*) as total_users FROM users;

-- 조건부 개수
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_users
FROM users;

-- 상태별 집계
SELECT status, COUNT(*) as count
FROM fault_reports
GROUP BY status;
```

#### SUM

```sql
-- 합계
SELECT SUM(fee) as total_revenue
FROM rentals
WHERE start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY);
```

#### AVG

```sql
-- 평균
SELECT AVG(bikes_available) as avg_bikes
FROM latest_station_status;
```

---

### 3.2 GROUP BY

#### 날짜별 집계

```sql
-- 최근 7일 대여 통계
SELECT DATE(start_time) as date, COUNT(*) as count
FROM rentals
WHERE start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(start_time)
ORDER BY date ASC;
```

#### 상태별 집계

```sql
-- 신고 상태별 분포
SELECT status, COUNT(*) as count
FROM fault_reports
GROUP BY status;

-- 자전거 상태별 분포
SELECT status, COUNT(*) as count
FROM bikes
GROUP BY status;
```

#### 지역별 집계

```sql
-- 지역별 대여소 수
SELECT a.area_name, COUNT(*) as count
FROM stations s
INNER JOIN areas a ON s.area_id = a.area_id
WHERE s.is_active = TRUE
GROUP BY a.area_id, a.area_name;
```

---

### 3.3 CTE (Common Table Expression)

#### 목적
- 복잡한 쿼리를 단계별로 분리
- 가독성 향상 및 재사용성

#### 예시: 최신 대여소 상태 조회

```sql
WITH latest_status AS (
  SELECT station_id, bikes_available, docks_available, snapshot_ts,
         ROW_NUMBER() OVER (PARTITION BY station_id ORDER BY snapshot_ts DESC) as rn
  FROM station_status
)
SELECT s.station_id, s.station_name,
       COALESCE(ls.bikes_available, 0) as bikes_available,
       COALESCE(ls.docks_available, 0) as docks_available
FROM stations s
LEFT JOIN latest_status ls ON s.station_id = ls.station_id AND ls.rn = 1
WHERE s.is_active = TRUE
```

**설명**
- `latest_status` CTE: 각 대여소별 최신 스냅샷만 선택
- `ROW_NUMBER()`: 윈도우 함수로 최신 데이터 식별
- 메인 쿼리: CTE와 조인하여 최신 상태만 조회

**사용 위치**
- `server/routes/admin.js` (라인 409-422)
- `server/routes/admin.js` (라인 342-355)

---

### 3.4 윈도우 함수 (Window Functions)

#### ROW_NUMBER()

```sql
SELECT station_id, bikes_available, snapshot_ts,
       ROW_NUMBER() OVER (PARTITION BY station_id ORDER BY snapshot_ts DESC) as rn
FROM station_status
```

**설명**
- `PARTITION BY station_id`: 대여소별로 그룹화
- `ORDER BY snapshot_ts DESC`: 최신 순으로 정렬
- `rn = 1`: 각 대여소의 최신 데이터만 선택

---

## 4. 사용자/관리자 권한 부여

### 4.1 세션 기반 인증

#### 세션 생성 (로그인)

```javascript
// server/routes/auth.js
router.post('/login', async (req, res, next) => {
  // ... 사용자 검증 ...
  
  // 세션에 사용자 정보 저장
  req.session.userId = user.user_id;
  req.session.role = user.role;  // 'USER' 또는 'ADMIN'
  req.session.email = user.email;
  
  res.json({ message: 'Login successful', user: {...} });
});
```

#### 세션 확인

```javascript
// server/middleware/auth.js
export const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.session.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

---

### 4.2 권한별 라우트 보호

#### 일반 사용자 전용

```javascript
// server/routes/favorites.js
router.get('/', requireAuth, async (req, res, next) => {
  // 로그인한 사용자만 접근 가능
  const userId = req.session.userId;
  // ...
});

// server/routes/mypage.js
router.get('/', requireAuth, async (req, res, next) => {
  // 로그인한 사용자만 접근 가능
  // ...
});
```

#### 관리자 전용

```javascript
// server/routes/admin.js
router.get('/users', requireAdmin, async (req, res, next) => {
  // 관리자만 접근 가능
  // ...
});

router.post('/stations', requireAdmin, async (req, res, next) => {
  // 관리자만 대여소 생성 가능
  // ...
});
```

---

### 4.3 프론트엔드 권한 체크

#### 사용자 정보 조회

```typescript
// client/lib/auth.ts
export const auth = {
  async getCurrentUser() {
    try {
      const response = await api.get('/api/auth/me');
      return response.data.user;
    } catch (error) {
      return null;
    }
  }
};
```

#### 조건부 렌더링

```typescript
// client/app/page.tsx
const [user, setUser] = useState<any>(null);

useEffect(() => {
  auth.getCurrentUser().then(setUser);
}, []);

// 관리자와 일반 사용자 다른 헤더 표시
{user?.role === 'ADMIN' ? (
  <nav>
    <Link href="/admin">관리자 대시보드</Link>
    <Link href="/community">커뮤니티</Link>
    <button onClick={handleLogout}>로그아웃</button>
  </nav>
) : user ? (
  <nav>
    <Link href="/mypage">마이페이지</Link>
    <Link href="/favorites">즐겨찾기</Link>
    <Link href="/community">커뮤니티</Link>
    <Link href="/reports/mine">내 신고</Link>
    <Link href="/congestion">혼잡도 예측</Link>
    <button onClick={handleLogout}>로그아웃</button>
  </nav>
) : (
  <nav>
    <Link href="/login">로그인</Link>
    <Link href="/register">회원가입</Link>
  </nav>
)}
```

---

### 4.4 데이터 접근 권한

#### 본인 데이터만 조회

```javascript
// server/routes/mypage.js
router.get('/', requireAuth, async (req, res, next) => {
  const userId = req.session.userId;  // 세션에서 사용자 ID 가져오기
  
  // 본인의 대여 이력만 조회
  const [rentals] = await pool.execute(
    'SELECT * FROM rentals WHERE user_id = ?',
    [userId]
  );
  
  // 본인의 즐겨찾기만 조회
  const [favorites] = await pool.execute(
    'SELECT * FROM favorites WHERE user_id = ?',
    [userId]
  );
});
```

#### 소유권 확인 후 수정/삭제

```javascript
// server/routes/community.js
router.put('/:id', requireAuth, async (req, res, next) => {
  const postId = parseInt(req.params.id);
  const userId = req.session.userId;
  
  // 소유권 확인
  const [posts] = await pool.execute(
    'SELECT author_id FROM posts WHERE post_id = ?',
    [postId]
  );
  
  if (posts[0].author_id !== userId) {
    return res.status(403).json({ error: 'Only the author can update this post' });
  }
  
  // 수정 진행
  await pool.execute(
    'UPDATE posts SET title = ?, body = ? WHERE post_id = ?',
    [title, body, postId]
  );
});
```

#### 관리자 또는 작성자만 삭제

```javascript
// server/routes/community.js
router.delete('/:id', requireAuth, async (req, res, next) => {
  const postId = parseInt(req.params.id);
  const userId = req.session.userId;
  const userRole = req.session.role;
  
  // 관리자 여부 확인
  const [users] = await pool.execute(
    'SELECT role FROM users WHERE user_id = ?',
    [userId]
  );
  const isAdmin = users.length > 0 && users[0].role === 'ADMIN';
  
  // 소유권 확인
  const [posts] = await pool.execute(
    'SELECT author_id FROM posts WHERE post_id = ?',
    [postId]
  );
  
  // 관리자 또는 작성자만 삭제 가능
  if (!isAdmin && posts[0].author_id !== userId) {
    return res.status(403).json({ error: 'Only the author or admin can delete this post' });
  }
  
  await pool.execute('DELETE FROM posts WHERE post_id = ?', [postId]);
});
```

---

## 5. 데이터 시각화 구현

### 5.1 부하율 색상 코딩

#### 사용자 관점

```javascript
// server/routes/stations.js
let color = 'blue'; // 기본값 (여유)
if (loadFactor < 0.5) {
  color = 'red';      // 부족
} else if (loadFactor < 0.8) {
  color = 'orange';   // 보통
} else if (loadFactor <= 1.2) {
  color = 'green';    // 양호
} else {
  color = 'blue';     // 여유
}
```

**색상 범위**
- **빨강 (red)**: `loadFactor < 0.5` - 부족
- **주황 (orange)**: `0.5 ≤ loadFactor < 0.8` - 보통
- **초록 (green)**: `0.8 ≤ loadFactor ≤ 1.2` - 양호
- **파랑 (blue)**: `loadFactor > 1.2` - 여유

---

#### 관리자 관점

```javascript
// server/routes/admin.js
let color = 'red'; // 기본값 (재배치 필요)
if (loadFactor < 0.5) {
  color = 'red';      // 부족 - 재배치 필요
} else if (loadFactor < 0.8) {
  color = 'orange';   // 보통
} else if (loadFactor <= 1.2) {
  color = 'green';    // 양호
} else {
  color = 'red';      // 과잉 - 재배치 필요
}
```

**색상 범위**
- **빨강 (red)**: `loadFactor < 0.5` 또는 `loadFactor > 1.2` - 재배치 필요
- **주황 (orange)**: `0.5 ≤ loadFactor < 0.8` - 보통
- **초록 (green)**: `0.8 ≤ loadFactor ≤ 1.2` - 양호

---

### 5.2 지도 시각화 (Leaflet)

#### 마커 색상 설정

```typescript
// client/components/MapView.tsx
const colorMap = {
  red: '#dc3545',      // 부족
  orange: '#fd7e14',  // 보통
  green: '#28a745',   // 양호
  blue: '#007bff'     // 여유
};

// 마커 생성
stations.map(station => {
  const markerColor = colorMap[station.color || 'blue'];
  return (
    <Marker
      position={[station.latitude, station.longitude]}
      icon={new Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${station.color || 'blue'}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })}
    >
      <Popup>
        <div>
          <h3>{station.station_name}</h3>
          <p>대여 가능: {station.bikes_available}대</p>
          <p>반납 가능: {station.docks_available}개</p>
        </div>
      </Popup>
    </Marker>
  );
});
```

---

### 5.3 차트 시각화 (Chart.js)

#### 시간대별 기준 수요 차트

```typescript
// client/app/station/[id]/page.tsx
const chartData = {
  labels: allBaselines.map(b => `${b.hour}시`),
  datasets: [{
    label: '기준 수요',
    data: allBaselines.map(b => b.baseline_demand),
    borderColor: 'rgb(75, 192, 192)',
    backgroundColor: 'rgba(75, 192, 192, 0.2)',
    tension: 0.1
  }]
};

<Line data={chartData} options={{
  responsive: true,
  scales: {
    y: {
      beginAtZero: true
    }
  }
}} />
```

---

#### 통계 대시보드 (Doughnut Chart)

```typescript
// client/app/admin/stats/page.tsx
const reportsChartData = {
  labels: stats.reportsByStatus.map((s: any) => s.status),
  datasets: [{
    data: stats.reportsByStatus.map((s: any) => s.count),
    backgroundColor: [
      '#dc3545',  // RECEIVED
      '#ffc107',  // IN_PROGRESS
      '#28a745',  // DONE
      '#6c757d'   // REJECTED
    ]
  }]
};

<Doughnut data={reportsChartData} options={chartOptions} />
```

---

### 5.4 D3.js 시각화

#### 부하율별 대여소 분포

```typescript
// client/components/D3Visualization.tsx
const categories = ['부족', '보통', '양호', '여유'];
const data = categories.map(cat => ({
  category: cat,
  count: stations.filter(s => {
    const lf = s.load_factor || 0;
    if (cat === '부족') return lf < 0.5;
    if (cat === '보통') return lf >= 0.5 && lf < 0.8;
    if (cat === '양호') return lf >= 0.8 && lf <= 1.2;
    return lf > 1.2;
  }).length
}));

// 막대 그래프 생성
const xScale = d3.scaleBand()
  .domain(categories)
  .range([0, width])
  .padding(0.2);

const yScale = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.count)])
  .range([height, 0]);

// 색상 스케일
const colorScale = d3.scaleOrdinal()
  .domain(categories)
  .range(['#dc3545', '#ffc107', '#28a745', '#007bff']);
```

---

## 6. Prepared Statement 사용

### 6.1 SQL Injection 방지

#### 올바른 사용법

```javascript
// ✅ Prepared Statement 사용
const [users] = await pool.execute(
  'SELECT * FROM users WHERE email = ?',
  [email]
);

// ✅ 여러 파라미터
await pool.execute(
  'INSERT INTO users (email, password_hash, nickname, role) VALUES (?, ?, ?, ?)',
  [email, passwordHash, nickname, 'USER']
);
```

#### 잘못된 사용법 (위험)

```javascript
// ❌ 문자열 연결 (SQL Injection 위험)
const query = `SELECT * FROM users WHERE email = '${email}'`;
const [users] = await pool.execute(query);

// ❌ LIMIT/OFFSET은 직접 삽입 (MySQL 제한)
// ❌ const [posts] = await pool.execute('SELECT * FROM posts LIMIT ? OFFSET ?', [limit, offset]);
// ✅ 대신 직접 삽입
const limitNum = parseInt(limit);
const offsetNum = parseInt(offset);
const query = `SELECT * FROM posts LIMIT ${limitNum} OFFSET ${offsetNum}`;
const [posts] = await pool.execute(query);
```

---

## 7. 성능 최적화

### 7.1 인덱스 활용

#### 주요 인덱스

```sql
-- 사용자 테이블
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_role ON users(role);
CREATE INDEX idx_is_active ON users(is_active);

-- 대여소 테이블
CREATE INDEX idx_area_id ON stations(area_id);
CREATE INDEX idx_is_active ON stations(is_active);
CREATE INDEX idx_location ON stations(latitude, longitude);

-- 대여소 상태 테이블
CREATE INDEX idx_station_id ON station_status(station_id);
CREATE INDEX idx_snapshot_ts ON station_status(snapshot_ts DESC);
CREATE INDEX idx_station_snapshot ON station_status(station_id, snapshot_ts DESC);

-- 기준 수요 테이블
CREATE INDEX idx_station_id ON station_baseline(station_id);
CREATE INDEX idx_dow_hour ON station_baseline(dow, hour);
```

---

### 7.2 쿼리 최적화

#### 서브쿼리 vs JOIN

```sql
-- ✅ 효율적: JOIN 사용
SELECT s.*, a.area_name
FROM stations s
INNER JOIN areas a ON s.area_id = a.area_id
WHERE s.is_active = TRUE;

-- ⚠️ 비효율적: 서브쿼리 남용
SELECT s.*,
       (SELECT area_name FROM areas WHERE area_id = s.area_id) as area_name
FROM stations s
WHERE s.is_active = TRUE;
```

#### LIMIT 사용

```sql
-- 최근 20개만 조회
SELECT * FROM rentals
WHERE user_id = ?
ORDER BY start_time DESC
LIMIT 20;
```

---

## 8. 에러 처리

### 8.1 데이터베이스 에러 처리

```javascript
try {
  const [result] = await pool.execute(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)',
    [email, passwordHash]
  );
  res.status(201).json({ message: 'User created', userId: result.insertId });
} catch (error) {
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({ error: 'Email already registered' });
  }
  next(error);  // 에러 미들웨어로 전달
}
```

---

### 8.2 NULL 처리

```sql
-- COALESCE: NULL을 기본값으로 변환
SELECT COALESCE(bikes_available, 0) as bikes_available
FROM station_status;

-- NULLIF: 0으로 나누기 방지
SELECT (bikes_available / NULLIF(docks_total, 0)) as utilization_rate
FROM stations;
```

---

## 요약

### 주요 계산식
1. **거리 계산**: Haversine 공식
2. **부하율**: `bikes_available / baseline_demand`
3. **반납 가능 도크**: `docks_total - bikes_available`
4. **이용률**: `bikes_available / docks_total`

### 주요 SQL 패턴
1. **JOIN**: INNER JOIN, LEFT JOIN
2. **서브쿼리**: 집계, EXISTS
3. **CTE**: 복잡한 쿼리 단계별 분리
4. **윈도우 함수**: ROW_NUMBER() 등

### 권한 관리
1. **세션 기반 인증**: `req.session.userId`, `req.session.role`
2. **미들웨어**: `requireAuth`, `requireAdmin`
3. **조건부 접근**: 소유권 확인, 역할 확인

### 데이터 시각화
1. **색상 코딩**: 부하율에 따른 색상 매핑
2. **지도**: Leaflet 마커 색상
3. **차트**: Chart.js, D3.js

