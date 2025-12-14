# 데이터 시각화 구현 보고서

---

## 2. 구현된 시각화 유형

### 2.1 지도 기반 시각화 (Leaflet)

#### 2.1.1 구현 목적
- 사용자 현재 위치 기반 주변 대여소 탐색
- 대여소별 실시간 자전거 가용성 시각화
- 부하율에 따른 색상 코딩을 통한 상태 파악

#### 2.1.2 기술 스택
- **라이브러리**: React-Leaflet, Leaflet
- **지도 타일**: OpenStreetMap

#### 2.1.3 구현 방법

```typescript
// client/components/MapView.tsx
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';

// 색상 매핑
const colorMap = {
  red: '#dc3545',      // 부족 (loadFactor < 0.5)
  orange: '#fd7e14',   // 보통 (0.5 ≤ loadFactor < 0.8)
  green: '#28a745',    // 양호 (0.8 ≤ loadFactor ≤ 1.2)
  blue: '#007bff'      // 여유 (loadFactor > 1.2)
};

// 마커 생성
{stations.map(station => (
  <Marker
    key={station.station_id}
    position={[station.latitude, station.longitude]}
    icon={new Icon({
      iconUrl: `marker-icon-${station.color || 'blue'}.png`,
      iconSize: [25, 41]
    })}
  >
    <Popup>
      <div>
        <h3>{station.station_name}</h3>
        <p>대여 가능: {station.bikes_available}대</p>
        <p>반납 가능: {station.docks_available}개</p>
        <p>부하율: {(station.load_factor * 100).toFixed(1)}%</p>
      </div>
    </Popup>
  </Marker>
))}

// 사용자 위치 반경 표시
{showUserLocation && userLocation && radius && (
  <Circle
    center={[userLocation.lat, userLocation.lng]}
    radius={radius * 1000}  // km를 m로 변환
    pathOptions={{
      color: '#007bff',
      fillColor: '#007bff',
      fillOpacity: 0.1
    }}
  />
)}
```

#### 2.1.4 주요 특징
- **동적 색상 코딩**: 부하율에 따라 마커 색상 자동 변경
- **반경 표시**: 사용자 위치 기준 탐색 반경을 원형으로 표시
- **상호작용**: 마커 클릭 시 상세 정보 팝업 표시
- **반응형**: 모바일/데스크톱 환경 모두 지원

---

### 2.2 D3.js 기반 시각화

#### 2.2.1 부하율별 대여소 분포 (막대 그래프)

##### 구현 목적
- 전체 대여소의 부하율 상태를 카테고리별로 분류하여 표시
- 부족/보통/양호/여유 상태의 대여소 수를 한눈에 파악

##### 기술 스택
- **라이브러리**: D3.js v7
- **차트 유형**: 막대 그래프 (Bar Chart)

##### 구현 방법

```typescript
// client/components/D3Visualization.tsx
import * as d3 from 'd3';

// 데이터 그룹화
const grouped = {
  부족: stations.filter(s => (s.load_factor || 0) < 0.5).length,
  보통: stations.filter(s => (s.load_factor || 0) >= 0.5 && (s.load_factor || 0) < 0.8).length,
  양호: stations.filter(s => (s.load_factor || 0) >= 0.8 && (s.load_factor || 0) <= 1.2).length,
  여유: stations.filter(s => (s.load_factor || 0) > 1.2).length,
};

// 스케일 설정
const xScale = d3.scaleBand()
  .domain(['부족', '보통', '양호', '여유'])
  .range([0, chartWidth])
  .padding(0.2);

const yScale = d3.scaleLinear()
  .domain([0, maxValue])
  .range([chartHeight, 0]);

// 색상 스케일
const colorScale = d3.scaleOrdinal<string>()
  .domain(['부족', '보통', '양호', '여유'])
  .range(['#dc3545', '#ffc107', '#28a745', '#007bff']);

// 막대 생성
g.selectAll('.bar')
  .data(data)
  .enter()
  .append('rect')
  .attr('class', 'bar')
  .attr('x', d => xScale(d.label) || 0)
  .attr('y', d => yScale(d.value))
  .attr('width', xScale.bandwidth())
  .attr('height', d => {
    const height = chartHeight - yScale(d.value);
    return d.value === 0 ? 2 : height;  // 0값도 최소 높이로 표시
  })
  .attr('fill', d => colorScale(d.label))
  .attr('rx', 4)  // 둥근 모서리
  .on('mouseover', function(event, d) {
    // 호버 효과 및 툴팁 표시
    d3.select(this)
      .attr('opacity', 0.7)
      .attr('transform', 'scale(1.05)');
  });
```

##### 주요 특징
- **범례 항상 표시**: 값이 0인 카테고리도 표시하여 데이터 분포를 명확히 표현
- **인터랙티브**: 마우스 호버 시 툴팁 및 확대 효과
- **색상 일관성**: 부하율 색상과 동일한 색상 체계 사용

##### 사용 위치
- `client/app/page.tsx`: 메인 페이지 (로그인한 사용자만 표시)

---

#### 2.2.2 관리자 통계 차트 (파이 차트)

##### 구현 목적
- 관리자 대시보드에서 다양한 통계를 파이 차트로 시각화
- 상태별 분포를 직관적으로 표현

##### 구현 방법

```typescript
// client/components/D3AdminChart.tsx
// 파이 차트 생성
const pie = d3.pie<{ label: string; value: number }>()
  .value(d => d.value)
  .sort(null);

const arc = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
  .innerRadius(0)
  .outerRadius(radius);

// 호 생성
arcs.append('path')
  .attr('d', arc)
  .attr('fill', d => colorScale(d.data.label))
  .attr('stroke', 'white')
  .attr('stroke-width', 2)
  .on('mouseover', function() {
    d3.select(this)
      .attr('opacity', 0.7)
      .attr('transform', 'scale(1.05)');
  });
```

##### 주요 특징
- **범례 포함**: 차트 옆에 범례 자동 생성
- **값 표시**: 각 호에 해당 값 표시
- **인터랙티브**: 호버 시 확대 효과

---

### 2.3 Chart.js 기반 시각화

#### 2.3.1 시간대별 기준 수요 차트 (라인 차트)

##### 구현 목적
- 대여소 상세 페이지에서 0시부터 23시까지의 기준 수요를 시간대별로 표시
- 시간대별 대여 패턴 파악

##### 기술 스택
- **라이브러리**: Chart.js v4, react-chartjs-2
- **차트 유형**: 라인 차트 (Line Chart)

##### 구현 방법

```typescript
// client/app/station/[id]/page.tsx
import { Line } from 'react-chartjs-2';

// 데이터 준비
const sortedBaselines = allBaselines?.sort((a: any, b: any) => a.hour - b.hour) || [];
const baselineChartData = {
  labels: sortedBaselines.map((b: any) => `${b.hour}시`),
  datasets: [{
    label: '기준 수요',
    data: sortedBaselines.map((b: any) => b.baseline_demand),
    borderColor: 'rgb(75, 192, 192)',
    backgroundColor: 'rgba(75, 192, 192, 0.2)',
    tension: 0.1,  // 부드러운 곡선
    fill: true
  }]
};

// 차트 렌더링
<Line 
  data={baselineChartData} 
  options={{
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    }
  }} 
/>
```

##### 주요 특징
- **24시간 데이터**: 0시부터 23시까지 모든 시간대 표시
- **부드러운 곡선**: `tension: 0.1`로 자연스러운 곡선 표현
- **반응형**: 화면 크기에 따라 자동 조정

##### 사용 위치
- `client/app/station/[id]/page.tsx`: 대여소 상세 페이지

---

#### 2.3.2 최근 7일 대여 통계 (막대 그래프)

##### 구현 목적
- 관리자 대시보드에서 최근 7일간의 일별 대여 건수 추이 표시
- 시간에 따른 대여 패턴 분석

##### 구현 방법

```typescript
// client/app/admin/page.tsx
const rentalsChartData = {
  labels: stats.rentalsLast7Days.map((r: any) => {
    const date = new Date(r.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }),
  datasets: [{
    label: '대여 건수',
    data: stats.rentalsLast7Days.map((r: any) => r.count),
    backgroundColor: 'rgba(102, 126, 234, 0.8)',
    borderColor: 'rgba(102, 126, 234, 1)',
    borderWidth: 2
  }]
};

<Bar data={rentalsChartData} options={chartOptions} />
```

##### 주요 특징
- **날짜 포맷팅**: 월/일 형식으로 간결하게 표시
- **그라데이션 색상**: 시각적 매력 향상

---

#### 2.3.3 통계 분포 차트 (도넛 차트)

##### 구현 목적
- 관리자 상세 통계 페이지에서 상태별 분포를 도넛 차트로 표시
- 신고 상태, 유지보수 상태, 대여소 혼잡도 등 다양한 통계 시각화

##### 구현 방법

```typescript
// client/app/admin/stats/page.tsx
import { Doughnut } from 'react-chartjs-2';

// 신고 상태별 분포
const reportsChartData = {
  labels: stats.reportsByStatus.map((r: any) => r.status),
  datasets: [{
    data: stats.reportsByStatus.map((r: any) => r.count),
    backgroundColor: [
      'rgba(220, 53, 69, 0.8)',  // RECEIVED
      'rgba(237, 137, 54, 0.8)',  // IN_PROGRESS
      'rgba(72, 187, 120, 0.8)',  // DONE
      'rgba(102, 126, 234, 0.8)', // REJECTED
    ],
    borderWidth: 2,
    borderColor: '#fff',
  }],
};

<Doughnut
  data={reportsChartData}
  options={{
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  }}
/>
```

##### 주요 특징
- **퍼센트 표시**: 툴팁에 개수와 비율을 함께 표시
- **테마별 색상**: 각 통계 항목에 맞는 색상 테마 적용
- **카드 디자인**: 그라데이션 배경과 테두리로 시각적 구분

##### 구현된 차트 유형
1. **신고 상태별 분포**: RECEIVED, IN_PROGRESS, DONE, REJECTED
2. **유지보수 상태별 분포**: ASSIGNED, WORKING, DONE, CANCELLED
3. **대여소 혼잡도 분포**: LOW, MEDIUM, HIGH
4. **지역별 대여소 수**: 강남구, 서초구, 송파구, 마포구, 종로구
5. **자전거 상태별 분포**: AVAILABLE, IN_USE, FAULT, MAINTENANCE

---

## 3. 부하율 계산 및 색상 코딩

### 3.1 부하율 계산식

#### 수식
```
loadFactor = bikes_available / baseline_demand
```

#### 설명
- **bikes_available**: 현재 대여 가능한 자전거 수 (AVAILABLE + FAULT 상태)
- **baseline_demand**: 해당 요일/시간대의 기준 수요 (평균 대여 가능 수)
- **결과**: 기준 수요 대비 현재 공급 비율

#### 폴백 로직
1. 현재 요일/시간대의 baseline 조회
2. 없으면 같은 요일의 가장 가까운 시간대 조회
3. 없으면 월요일 8시 baseline 사용
4. 최종 폴백: 기본값 10

---

### 3.2 색상 코딩 체계

#### 사용자 관점

| 부하율 범위 | 상태 | 색상 | 설명 |
|------------|------|------|------|
| `loadFactor < 0.5` | 부족 | 빨강 (#dc3545) | 자전거가 부족하여 대여 어려움 |
| `0.5 ≤ loadFactor < 0.8` | 보통 | 주황 (#fd7e14) | 대여 가능하나 여유 없음 |
| `0.8 ≤ loadFactor ≤ 1.2` | 양호 | 초록 (#28a745) | 적정 수준의 자전거 보유 |
| `loadFactor > 1.2` | 여유 | 파랑 (#007bff) | 충분한 자전거 보유 |

#### 관리자 관점

| 부하율 범위 | 상태 | 색상 | 설명 |
|------------|------|------|------|
| `loadFactor < 0.5` | 부족 | 빨강 (#dc3545) | 재배치 필요 (자전거 공급 필요) |
| `0.5 ≤ loadFactor < 0.8` | 보통 | 주황 (#fd7e14) | 보통 상태 |
| `0.8 ≤ loadFactor ≤ 1.2` | 양호 | 초록 (#28a745) | 적정 상태 |
| `loadFactor > 1.2` | 과잉 | 빨강 (#dc3545) | 재배치 필요 (자전거 회수 필요) |

#### 구현 코드

```javascript
// server/routes/stations.js (사용자 관점)
let color = 'blue';
if (loadFactor < 0.5) color = 'red';
else if (loadFactor < 0.8) color = 'orange';
else if (loadFactor <= 1.2) color = 'green';
else color = 'blue';

// server/routes/admin.js (관리자 관점)
let color = 'red';
if (loadFactor < 0.5) color = 'red';      // 부족
else if (loadFactor < 0.8) color = 'orange';
else if (loadFactor <= 1.2) color = 'green';
else color = 'red';  // 과잉도 빨강 (재배치 필요)
```

---

## 4. 데이터 시각화 구현 특징

### 4.1 실시간 데이터 반영

#### 구현 방법
- **서버 사이드**: MySQL에서 실시간으로 자전거 수 집계
- **클라이언트 사이드**: React의 `useEffect`와 `useState`로 주기적 데이터 갱신
- **API 호출**: `axios`를 통한 RESTful API 통신

```typescript
// 실시간 데이터 갱신
useEffect(() => {
  const fetchStations = async () => {
    const response = await api.get('/api/stations/nearby', {
      params: { lat, lng, radius }
    });
    setStations(response.data.stations);
  };
  
  fetchStations();
  const interval = setInterval(fetchStations, 30000); // 30초마다 갱신
  
  return () => clearInterval(interval);
}, [lat, lng, radius]);
```

---

### 4.2 반응형 디자인

#### 구현 방법
- **CSS Grid/Flexbox**: 화면 크기에 따라 자동 레이아웃 조정
- **Chart.js 반응형 옵션**: `responsive: true` 설정
- **D3.js 동적 크기**: `useRef`와 `useEffect`로 컨테이너 크기 감지

```typescript
// 반응형 차트 옵션
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
};
```

---

### 4.3 인터랙티브 기능

#### 구현된 기능
1. **마커 클릭**: 대여소 상세 정보 팝업
2. **호버 효과**: 차트 요소에 마우스 오버 시 툴팁 및 확대
3. **필터링**: 반경 조절, 상태별 필터링
4. **동적 업데이트**: 데이터 변경 시 자동 차트 갱신

```typescript
// D3.js 호버 효과
.on('mouseover', function(event, d) {
  d3.select(this)
    .attr('opacity', 0.7)
    .attr('transform', 'scale(1.05)');
  
  // 툴팁 표시
  const tooltip = g.append('g')
    .attr('class', 'tooltip')
    .attr('transform', `translate(${x}, ${y})`);
  
  tooltip.append('text')
    .text(`${d.value}개`);
})
.on('mouseout', function() {
  d3.select(this)
    .attr('opacity', 1)
    .attr('transform', 'scale(1)');
  g.selectAll('.tooltip').remove();
});
```

---

### 4.4 성능 최적화

#### 구현 방법
1. **동적 임포트**: D3.js 컴포넌트를 `dynamic()`으로 지연 로딩
2. **메모이제이션**: 불필요한 리렌더링 방지
3. **데이터 필터링**: 서버 사이드에서 필요한 데이터만 전송

```typescript
// 동적 임포트로 번들 크기 최적화
const D3Visualization = dynamic(() => import('@/components/D3Visualization'), {
  ssr: false
});
```

---

## 5. 시각화 결과 및 효과

### 5.1 사용자 경험 개선

#### 효과
- **직관적 정보 파악**: 색상 코딩을 통한 즉각적인 상태 인식
- **공간적 이해**: 지도 기반 시각화로 위치 관계 파악
- **의사결정 지원**: 부하율 정보를 통한 최적 대여소 선택

---

### 5.2 관리자 의사결정 지원

#### 효과
- **전체 현황 파악**: 통계 차트를 통한 한눈에 보는 시스템 상태
- **트렌드 분석**: 시간대별, 일별 패턴 분석
- **재배치 계획**: 부하율 지도를 통한 효율적인 자전거 재배치

---

### 5.3 데이터 접근성 향상

#### 효과
- **다양한 표현 방식**: 지도, 막대 그래프, 라인 차트, 도넛 차트 등
- **상호작용**: 사용자 조작을 통한 데이터 탐색
- **반응형**: 다양한 디바이스에서 일관된 경험 제공

---

## 6. 기술적 특징

### 6.1 라이브러리 선택 이유

#### D3.js
- **장점**: 높은 커스터마이징 가능, 세밀한 제어
- **사용처**: 부하율 분포 막대 그래프, 관리자 파이 차트
- **특징**: SVG 기반, 인터랙티브 기능 구현 용이

#### Chart.js
- **장점**: 간편한 사용, 반응형 지원, 다양한 차트 유형
- **사용처**: 시간대별 기준 수요, 최근 7일 대여 통계, 상태별 분포
- **특징**: Canvas 기반, 빠른 렌더링

#### React-Leaflet
- **장점**: React와의 통합 용이, 풍부한 지도 기능
- **사용처**: 대여소 위치 표시, 사용자 위치 기반 탐색
- **특징**: OpenStreetMap 기반, 무료 사용 가능

---

### 6.2 데이터 처리

#### 서버 사이드
- **SQL 집계**: COUNT, GROUP BY를 통한 효율적인 데이터 집계
- **CTE 활용**: 복잡한 쿼리를 단계별로 분리
- **윈도우 함수**: 최신 데이터만 선택

#### 클라이언트 사이드
- **데이터 변환**: 서버 데이터를 차트 형식으로 변환
- **필터링**: 사용자 입력에 따른 동적 필터링
- **캐싱**: 불필요한 API 호출 최소화

---

## 7. 구현 통계

### 7.1 구현된 시각화 유형

| 유형 | 라이브러리 | 개수 | 위치 |
|------|-----------|------|------|
| 지도 시각화 | React-Leaflet | 2개 | 메인 페이지, 관리자 지도 페이지 |
| 막대 그래프 | D3.js | 1개 | 메인 페이지 (부하율 분포) |
| 파이 차트 | D3.js | 1개 | 관리자 대시보드 |
| 라인 차트 | Chart.js | 2개 | 대여소 상세 페이지 (시간대별 기준 수요, 상태 이력) |
| 막대 그래프 | Chart.js | 1개 | 관리자 대시보드 (최근 7일 대여 통계) |
| 도넛 차트 | Chart.js | 5개 | 관리자 상세 통계 페이지 |

**총 12개의 시각화 컴포넌트 구현**

---

### 7.2 데이터 시각화 페이지

1. **메인 페이지** (`/`): 지도 + 부하율 분포 막대 그래프
2. **대여소 상세 페이지** (`/station/[id]`): 시간대별 기준 수요 라인 차트
3. **관리자 대시보드** (`/admin`): 최근 7일 대여 통계 막대 그래프
4. **관리자 상세 통계** (`/admin/stats`): 5개의 도넛 차트
5. **관리자 지도** (`/admin/stations-map`): 부하율 색상 코딩 지도


## 부록: 주요 코드 위치

### 시각화 컴포넌트
- `client/components/MapView.tsx`: 지도 시각화
- `client/components/D3Visualization.tsx`: 부하율 분포 막대 그래프
- `client/components/D3AdminChart.tsx`: 관리자 파이 차트

### 차트 페이지
- `client/app/page.tsx`: 메인 페이지 (지도 + D3 차트)
- `client/app/station/[id]/page.tsx`: 대여소 상세 (라인 차트)
- `client/app/admin/page.tsx`: 관리자 대시보드 (막대 그래프)
- `client/app/admin/stats/page.tsx`: 관리자 상세 통계 (도넛 차트)

### 데이터 처리
- `server/routes/stations.js`: 대여소 데이터 및 부하율 계산
- `server/routes/admin.js`: 관리자 통계 데이터 집계

