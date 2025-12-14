# 특별 기능 상세 설명

## 1. 부하율(Load Factor) 계산 방식

### 1.1 기본 계산식

부하율은 대여소의 현재 자전거 가용성을 기준 수요와 비교하여 계산됩니다.

```
부하율(Load Factor) = 현재 대여 가능한 자전거 수 / 기준 수요(baseline_demand)
```

#### 구성 요소

- **현재 대여 가능한 자전거 수 (bikes_available)**: `bikes` 테이블에서 `station_id`가 일치하고 `status`가 `'AVAILABLE'` 또는 `'FAULT'`인 자전거의 개수
- **기준 수요 (baseline_demand)**: `station_baseline` 테이블에 저장된 해당 대여소의 요일(dow)과 시간(hour)에 따른 평균 대여 가능 수

### 1.2 기준 수요(baseline_demand) 조회 로직

기준 수요는 다음 순서로 조회되며, 각 단계에서 데이터가 없으면 다음 단계로 진행합니다.

#### 1단계: 현재 요일/시간대의 baseline 조회
```sql
SELECT baseline_demand 
FROM station_baseline 
WHERE station_id = ? AND dow = ? AND hour = ?
```

#### 2단계: 같은 요일의 가장 가까운 시간대 조회
현재 시간대에 baseline이 없을 경우, 같은 요일 내에서 시간 차이가 가장 작은 baseline을 사용합니다.
```sql
SELECT baseline_demand 
FROM station_baseline 
WHERE station_id = ? AND dow = ? 
ORDER BY ABS(hour - ?) 
LIMIT 1
```

#### 3단계: 월요일 8시 baseline 사용
같은 요일에도 baseline이 없을 경우, 월요일(요일 코드 1) 8시의 baseline을 기본값으로 사용합니다.
```sql
SELECT baseline_demand 
FROM station_baseline 
WHERE station_id = ? AND dow = 1 AND hour = 8 
LIMIT 1
```

#### 4단계: 최종 폴백
위 모든 단계에서 baseline을 찾지 못한 경우, 기본값 **10**을 사용합니다.

### 1.3 부하율 기반 상태 분류

부하율 값에 따라 대여소 상태를 4가지로 분류합니다.

| 부하율 범위 | 상태 | 색상 (사용자) | 색상 (관리자) | 설명 |
|------------|------|--------------|--------------|------|
| `loadFactor < 0.5` | 부족 | 빨강 (#dc3545) | 빨강 (#dc3545) | 자전거가 부족하여 대여 어려움 / 재배치 필요 |
| `0.5 ≤ loadFactor < 0.8` | 보통 | 주황 (#fd7e14) | 주황 (#fd7e14) | 대여 가능하나 여유 없음 |
| `0.8 ≤ loadFactor ≤ 1.2` | 양호 | 초록 (#28a745) | 초록 (#28a745) | 적정 수준의 자전거 보유 |
| `loadFactor > 1.2` | 여유/과잉 | 파랑 (#007bff) | 빨강 (#dc3545) | 충분한 자전거 보유 / 재배치 필요 (관리자) |

#### 사용자 관점과 관리자 관점의 차이

- **사용자 관점**: 여유 상태(loadFactor > 1.2)는 파란색으로 표시되어 충분한 자전거가 있다는 긍정적 의미
- **관리자 관점**: 과잉 상태(loadFactor > 1.2)는 빨간색으로 표시되어 자전거 회수가 필요하다는 의미

### 1.4 구현 위치

- **서버 사이드 계산**: `server/routes/stations.js` (사용자용), `server/routes/admin.js` (관리자용)
- **클라이언트 사이드 표시**: `client/components/MapView.tsx`, `client/app/admin/stations-map/page.tsx`
- **데이터베이스**: `station_baseline` 테이블에 요일별, 시간대별 기준 수요 저장

---

## 2. 혼잡도 예측 기능

### 2.1 예측 목적

사용자가 특정 시간대에 대여소의 혼잡도를 미리 예측하여, 이용하기 좋은 대여소를 선택할 수 있도록 지원합니다.

### 2.2 예측 계산 방식

현재 구현에서는 **현재 대여 가능한 자전거 수를 기반으로 예측**합니다. 향후 시계열 분석이나 머신러닝 기반 예측 모델을 적용할 수 있도록 구조화되어 있습니다.

#### 현재 예측 알고리즘

```javascript
// 1. 현재 대여 가능한 자전거 수 조회
const currentBikesAvailable = station.bikes_available || 0;

// 2. 예측할 시간대의 기준 수요(baseline_demand) 조회
const baseline = baselineMap.get(station.station_id) || 10;

// 3. 예측된 부하율 계산
const predictedLoadFactor = baseline > 0 
  ? currentBikesAvailable / baseline 
  : 0;

// 4. 상태 분류
let loadFactorStatus = '보통';
if (predictedLoadFactor < 0.5) loadFactorStatus = '부족';
else if (predictedLoadFactor < 0.8) loadFactorStatus = '보통';
else if (predictedLoadFactor <= 1.2) loadFactorStatus = '양호';
else loadFactorStatus = '여유';
```

#### 예측 로직의 특징

1. **시간대 선택**: 사용자가 0시부터 23시까지 원하는 시간대를 선택할 수 있습니다.
2. **기준 수요 활용**: 선택한 시간대의 `baseline_demand`를 사용하여 해당 시간대의 평균 수요를 반영합니다.
3. **현재 상태 기반**: 현재 대여 가능한 자전거 수를 그대로 사용합니다. (향후 개선 가능)

### 2.3 향후 개선 방향

현재는 단순히 현재 상태를 기반으로 예측하지만, 다음과 같은 개선이 가능합니다:

1. **시계열 분석**: 과거 대여 패턴을 분석하여 시간대별 예측 정확도 향상
2. **머신러닝 모델**: LSTM, ARIMA 등 시계열 예측 모델 적용
3. **요일별 패턴**: 평일/주말, 공휴일 등 특수한 날짜 패턴 반영
4. **날씨 데이터**: 날씨 정보를 활용한 수요 예측
5. **이벤트 정보**: 지역 이벤트나 행사 정보를 반영한 예측

### 2.4 구현 위치

- **API 엔드포인트**: `GET /api/stations/congestion/all?targetHour={시간}`
- **서버 로직**: `server/routes/stations.js` (라인 155-226)
- **클라이언트 페이지**: `client/app/congestion/page.tsx`

### 2.5 사용자 인터페이스

- **시간대 선택**: 드롭다운 메뉴에서 0시부터 23시까지 선택
- **예측 결과 표시**: 대여소별로 예측된 부하율 상태(부족/보통/양호/여유)를 색상으로 표시
- **정렬 기능**: 상태별, 지역별로 정렬하여 확인 가능
- **추천 대여소**: 양호 상태의 대여소를 우선적으로 표시

---

## 3. 재배치 관리 프로세스

### 3.1 재배치 목적

대여소 간 자전거 수의 불균형을 해소하여, 모든 대여소에서 적정 수준의 자전거를 유지할 수 있도록 자동으로 재배치 제안을 생성합니다.

### 3.2 재배치 필요성 판단 기준

#### 부족 대여소 식별

다음 조건을 만족하는 대여소는 자전거가 부족한 것으로 판단합니다:

```javascript
const thresholdLow = 3; // 임계값: 3대 미만

// 부족 대여소 조건
bikes_available < thresholdLow || bikes_available === null
```

#### 여유 대여소 식별

다음 조건을 만족하는 대여소는 자전거가 여유로운 것으로 판단합니다:

```javascript
const thresholdHigh = 0.8; // 이용률 임계값: 80% 이상

// 여유 대여소 조건
utilization_ratio > thresholdHigh && bikes_available > thresholdLow
```

여기서 `utilization_ratio`는 다음과 같이 계산됩니다:

```
utilization_ratio = bikes_available / docks_total
```

### 3.3 재배치 제안 생성 알고리즘

재배치 제안은 다음과 같은 휴리스틱 알고리즘을 사용합니다:

```javascript
// 1. 부족 대여소와 여유 대여소 목록 생성
const needsBikes = stations.filter(s => 
  s.bikes_available < thresholdLow || s.bikes_available === null
);

const hasExcess = stations.filter(s => 
  s.utilization_ratio > thresholdHigh && s.bikes_available > thresholdLow
);

// 2. 각 부족 대여소에 대해 여유 대여소와 매칭
const suggestions = [];
for (const need of needsBikes.slice(0, 10)) { // 최대 10개까지만 처리
  const excess = hasExcess.find(e => 
    e.bikes_available > thresholdLow + 2 // 최소 2대 이상 여유가 있어야 함
  );
  
  if (excess) {
    // 3. 이동할 자전거 수 계산
    const transferAmount = Math.min(
      Math.ceil((thresholdLow + 5 - need.bikes_available) / 2), // 부족 대여소가 필요한 수량
      Math.floor((excess.bikes_available - thresholdLow) / 2)   // 여유 대여소가 제공 가능한 수량
    );
    
    if (transferAmount > 0) {
      suggestions.push({
        from_station_id: excess.station_id,
        from_station_name: excess.station_name,
        to_station_id: need.station_id,
        to_station_name: need.station_name,
        suggested_bikes: transferAmount
      });
    }
  }
}
```

#### 이동 수량 계산 로직

이동할 자전거 수는 다음 두 값을 비교하여 작은 값을 선택합니다:

1. **부족 대여소가 필요한 수량**: `(thresholdLow + 5 - 현재 자전거 수) / 2`
   - 목표: 최소 3대 + 여유 5대 = 8대 이상
   - 현재 부족한 수량의 절반을 이동

2. **여유 대여소가 제공 가능한 수량**: `(현재 자전거 수 - thresholdLow) / 2`
   - 여유 대여소도 최소 3대는 유지
   - 나머지 여유분의 절반을 제공

### 3.4 재배치 프로세스 단계

#### 1단계: 대여소 상태 조회

최신 대여소 상태를 조회합니다. 윈도우 함수를 사용하여 각 대여소의 최신 스냅샷만 선택합니다.

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

#### 2단계: 부족/여유 대여소 분류

조회된 대여소 목록을 기준에 따라 부족 대여소와 여유 대여소로 분류합니다.

#### 3단계: 재배치 제안 생성

부족 대여소와 여유 대여소를 매칭하여 재배치 제안을 생성합니다. 최대 10개의 부족 대여소에 대해 제안을 생성합니다.

#### 4단계: 재배치 실행 (향후 구현)

현재는 제안만 생성하지만, 향후 다음과 같은 기능을 추가할 수 있습니다:

- 재배치 실행 버튼 클릭 시 실제 자전거 이동 처리
- 이동할 자전거 선택 (특정 자전거 ID 지정)
- 이동 이력 기록 (`rebalancing_log` 테이블 생성)
- 이동 알림 (관리자에게 알림 전송)

### 3.5 구현 위치

- **API 엔드포인트**: `GET /api/admin/rebalancing`
- **서버 로직**: `server/routes/admin.js` (라인 336-398)
- **클라이언트 페이지**: `client/app/admin/rebalancing/page.tsx`

### 3.6 향후 개선 방향

1. **최적 경로 계산**: 여러 대여소 간의 최적 이동 경로를 계산하여 이동 비용 최소화
2. **거리 기반 매칭**: 가까운 대여소 간의 재배치를 우선적으로 제안
3. **시간대별 재배치**: 특정 시간대에 집중적으로 발생하는 수요를 고려한 재배치
4. **예측 기반 재배치**: 혼잡도 예측 결과를 활용하여 사전에 재배치 제안
5. **자동화**: 특정 조건을 만족하면 자동으로 재배치 실행

---

## 4. 대여소 혼잡도 분류

### 4.1 혼잡도 레벨 정의

관리자 통계 대시보드에서 대여소를 혼잡도에 따라 3단계로 분류합니다.

| 자전거 수 | 혼잡도 레벨 | 설명 |
|----------|------------|------|
| `bikes_available < 3` | LOW | 자전거가 매우 부족한 상태 |
| `3 ≤ bikes_available < 10` | MEDIUM | 보통 수준의 자전거 보유 |
| `bikes_available ≥ 10` | HIGH | 충분한 자전거 보유 |

### 4.2 혼잡도 집계 쿼리

윈도우 함수를 사용하여 각 대여소의 최신 상태만 선택하고, 자전거 수에 따라 혼잡도 레벨을 분류합니다.

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

### 4.3 구현 위치

- **서버 로직**: `server/routes/admin.js` (라인 492-510)
- **클라이언트 표시**: `client/app/admin/stats/page.tsx` (도넛 차트로 시각화)

---

## 5. 기준 수요(baseline_demand) 데이터 구조

### 5.1 데이터 저장 구조

`station_baseline` 테이블에 대여소별, 요일별, 시간대별 기준 수요를 저장합니다.

#### 테이블 구조

- `station_id`: 대여소 ID
- `dow` (Day of Week): 요일 (0=일요일, 1=월요일, ..., 6=토요일)
- `hour`: 시간 (0-23)
- `baseline_demand`: 해당 요일/시간대의 평균 대여 가능 수

#### 데이터 범위

- **대여소 수**: 29개
- **요일 수**: 7일 (일요일~토요일)
- **시간대 수**: 24시간 (0시~23시)
- **총 레코드 수**: 29 × 7 × 24 = 4,872개

### 5.2 기준 수요 생성 방법

시드 데이터에서 CROSS JOIN을 활용하여 모든 조합의 baseline을 생성합니다.

```sql
-- 예시: 모든 대여소, 모든 요일, 모든 시간대에 대해 baseline 생성
INSERT INTO station_baseline (station_id, dow, hour, baseline_demand)
SELECT 
  s.station_id,
  d.dow,
  h.hour,
  FLOOR(5 + RAND() * 10) as baseline_demand  -- 5~15 사이 랜덤 값
FROM stations s
CROSS JOIN (SELECT 0 as dow UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) d
CROSS JOIN (SELECT 0 as hour UNION SELECT 1 UNION ... UNION SELECT 23) h
WHERE s.is_active = TRUE
```

### 5.3 기준 수요 활용

기준 수요는 다음과 같은 용도로 활용됩니다:

1. **부하율 계산**: 현재 자전거 수와 비교하여 부하율 산출
2. **혼잡도 예측**: 특정 시간대의 예상 수요 파악
3. **재배치 판단**: 대여소별 적정 자전거 수 기준 설정
4. **통계 분석**: 시간대별, 요일별 대여 패턴 분석

---

## 6. 실시간 데이터 집계

### 6.1 자전거 수 집계 방식

초기에는 `station_status` 테이블의 스냅샷을 사용했으나, 데이터 일관성 문제로 인해 `bikes` 테이블에서 직접 집계하는 방식으로 변경되었습니다.

#### 현재 방식

```sql
SELECT 
  COUNT(*) as bikes_available,
  COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END) as available_count,
  COUNT(CASE WHEN status = 'FAULT' THEN 1 END) as fault_count
FROM bikes 
WHERE station_id = ? 
AND status IN ('AVAILABLE', 'FAULT')
```

#### 장점

- **실시간 정확성**: `bikes` 테이블의 현재 상태를 직접 반영
- **데이터 일관성**: 스냅샷과 실제 데이터 간 불일치 문제 해결
- **성능**: 인덱스를 활용한 빠른 집계

### 6.2 성능 최적화

`bikes` 테이블의 `station_id`와 `status`에 복합 인덱스를 생성하여 조회 성능을 최적화했습니다.

```sql
CREATE INDEX idx_bikes_station_status ON bikes(station_id, status);
```

이 인덱스를 통해 대여소별 자전거 수 집계 쿼리의 성능이 크게 향상되었습니다.

---

## 7. 요약

본 프로젝트에서 구현한 특별 기능들은 다음과 같은 계산 방식과 프로세스를 사용합니다:

1. **부하율 계산**: 기준 수요 대비 현재 자전거 수의 비율을 계산하여 대여소 상태를 4단계로 분류
2. **혼잡도 예측**: 시간대별 기준 수요를 활용하여 특정 시간대의 예상 혼잡도를 예측
3. **재배치 관리**: 부족/여유 대여소를 자동으로 식별하고 최적의 재배치 제안을 생성
4. **혼잡도 분류**: 자전거 수에 따라 대여소를 3단계 혼잡도로 분류하여 통계 제공

이러한 기능들은 모두 데이터베이스의 기준 수요(baseline_demand) 데이터와 실시간 자전거 상태를 기반으로 동작하며, 향후 머신러닝이나 시계열 분석을 통한 정확도 향상이 가능한 구조로 설계되었습니다.

