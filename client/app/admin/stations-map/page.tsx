'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { auth } from '@/lib/auth';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
});

export default function AdminStationsMapPage() {
  const router = useRouter();
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.getCurrentUser().then((user) => {
      if (!user || user.role !== 'ADMIN') {
        router.push('/');
        return;
      }
      fetchStations();
    });
  }, []);

  const fetchStations = async () => {
    try {
      const response = await api.get('/api/admin/stations/utilization');
      console.log('Stations data:', response.data.stations?.slice(0, 3)); // 디버깅용
      setStations(response.data.stations);
    } catch (err) {
      console.error('Failed to fetch stations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container">로딩 중...</div>;

  return (
    <div>
      <header className="header">
        <div className="container">
          <nav>
            <Link href="/">SD (Ddarungi) Insight</Link>
            <Link href="/admin">← 대시보드</Link>
          </nav>
        </div>
      </header>

      <main className="container">
        <h1 className="page-title">대여소 이용률 지도</h1>
        <p style={{ marginBottom: '20px', color: '#718096' }}>
          평소 이용률 대비 현재 자전거 배치율을 색상으로 표시합니다.
        </p>

        <div className="main-content">
          <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="station-marker red"></span>
              <span>부족 (부하율 &lt; 50%) - 재배치 필요</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="station-marker orange"></span>
              <span>보통 (50-80%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="station-marker green"></span>
              <span>양호 (80-120%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="station-marker red"></span>
              <span>과잉 (&gt; 120%) - 재배치 필요</span>
            </div>
          </div>

          {stations.length > 0 && (
            <MapView
              stations={stations.map(s => {
                // 부하율에 따라 색상 직접 계산
                const loadFactor = parseFloat(s.load_factor) || 0;
                let color = 'blue';
                
                // 관리자 관점: 부족(<0.5) 또는 과잉(>1.2) = 빨강, 보통(0.5-0.8) = 주황, 양호(0.8-1.2) = 초록
                if (loadFactor < 0.5) {
                  color = 'red'; // 부족 - 재배치 필요
                } else if (loadFactor < 0.8) {
                  color = 'orange'; // 보통
                } else if (loadFactor <= 1.2) {
                  color = 'green'; // 양호
                } else {
                  color = 'red'; // 과잉 - 재배치 필요
                }

                const stationData = {
                  ...s,
                  latitude: s.latitude ? parseFloat(String(s.latitude)) : 37.5665,
                  longitude: s.longitude ? parseFloat(String(s.longitude)) : 126.9780,
                  bikes_available: s.bikes_available || 0,
                  docks_available: s.docks_available || 0,
                  load_factor: loadFactor,
                  color: color, // 부하율에 따른 색상
                };
                
                // 디버깅: 첫 번째 대여소만 로그 출력
                if (s.station_id === stations[0].station_id) {
                  console.log('Station color mapping:', {
                    station_id: s.station_id,
                    load_factor: loadFactor,
                    color: color,
                    original_color: s.color
                  });
                }
                
                return stationData;
              }).filter(s => !isNaN(s.latitude) && !isNaN(s.longitude))}
              userLocation={{ lat: 37.5665, lng: 126.9780 }}
              selectedStation={null}
              showUserLocation={false}
              onStationClick={(stationId) => {
                router.push(`/station/${stationId}`);
              }}
            />
          )}

          <div style={{ marginTop: '24px' }}>
            <h2>대여소 목록</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>대여소</th>
                    <th>대여 가능</th>
                    <th>반납 가능</th>
                    <th>이용률</th>
                    <th>부하율</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map((station) => (
                    <tr key={station.station_id}>
                      <td style={{ fontWeight: '600' }}>{station.station_name}</td>
                      <td>{station.bikes_available}대</td>
                      <td>{station.docks_available}개</td>
                      <td>{((station.utilization_rate || 0) * 100).toFixed(1)}%</td>
                      <td>{((station.load_factor || 0) * 100).toFixed(1)}%</td>
                      <td>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: 
                            station.load_factor < 0.5 ? '#dc3545' :
                            station.load_factor < 0.8 ? '#fd7e14' :
                            station.load_factor <= 1.2 ? '#28a745' : '#dc3545',
                          color: 'white',
                        }}>
                          {station.load_factor < 0.5 ? '부족' :
                           station.load_factor < 0.8 ? '보통' :
                           station.load_factor <= 1.2 ? '양호' : '과잉'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

