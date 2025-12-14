'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function StationDetailPage() {
  const params = useParams();
  const stationId = params.id;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchStationDetail();
  }, [stationId]);

  const fetchStationDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/api/stations/${stationId}`);
      
      if (!response.data) {
        throw new Error('No data received');
      }
      
      setData(response.data);
      
      // Check if favorite
      try {
        const favResponse = await api.get('/api/favorites');
        const favorites = favResponse.data.favorites;
        setIsFavorite(favorites.some((f: any) => f.station_id === parseInt(stationId as string)));
      } catch (err) {
        // Not logged in or error - not critical
        setIsFavorite(false);
      }
    } catch (err: any) {
      console.error('Failed to fetch station details:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch station details';
      setError(errorMessage);
      
      // 기본 데이터로 설정하여 페이지가 완전히 깨지지 않도록
      setData({
        station: { station_name: '대여소 정보 없음', area_name: '알 수 없음', docks_total: 0 },
        latestStatus: { bikes_available: 0, docks_available: 0 },
        baseline: { baseline_demand: 10 },
        loadFactor: 0,
        history: [],
        allBaselines: [],
        bikes: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container">로딩 중...</div>;
  if (error) return <div className="container">오류: {error}</div>;
  if (!data) return null;

  const { station, latestStatus, baseline, loadFactor, history, allBaselines, bikes } = data;

  // Prepare chart data
  const chartData = {
    labels: history?.map((h: any) => new Date(h.snapshot_ts).toLocaleString()) || [],
    datasets: [
      {
        label: '대여 가능',
        data: history?.map((h: any) => h.bikes_available) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
      {
        label: '반납 가능',
        data: history?.map((h: any) => h.docks_available) || [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
      },
    ],
  };

  // 0-23시 모두 포함하도록 정렬
  const sortedBaselines = allBaselines?.sort((a: any, b: any) => a.hour - b.hour) || [];
  const baselineChartData = {
    labels: sortedBaselines.map((b: any) => `${b.hour}시`) || [],
    datasets: [
      {
        label: '기준 수요',
        data: sortedBaselines.map((b: any) => b.baseline_demand) || [],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
      },
    ],
  };

  return (
    <div>
      <header className="header">
        <div className="container">
          <nav>
            <Link href="/">SD (Ddarungi) Insight</Link>
          </nav>
        </div>
      </header>

      <main className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Link href="/">← 뒤로</Link>
          <button
            onClick={async () => {
              try {
                if (isFavorite) {
                  await api.delete(`/api/favorites/${stationId}`);
                  setIsFavorite(false);
                } else {
                  await api.post('/api/favorites', { stationId: parseInt(stationId as string) });
                  setIsFavorite(true);
                }
              } catch (err) {
                console.error('Failed to toggle favorite:', err);
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '32px',
              padding: '8px',
              color: isFavorite ? '#ffc107' : 'transparent',
              WebkitTextStroke: isFavorite ? 'none' : '1px #cbd5e0',
              transition: 'all 0.2s',
            }}
            title={isFavorite ? '즐겨찾기 제거' : '즐겨찾기 추가'}
          >
            ⭐
          </button>
        </div>
        <h1>{station.station_name}</h1>

        {/* 현재 상태 - 세련된 디자인 */}
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '32px',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '24px' }}>현재 상태</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.2)', 
              padding: '20px', 
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>지역</div>
              <div style={{ fontSize: '20px', fontWeight: '700' }}>{station.area_name}</div>
            </div>
            
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.2)', 
              padding: '20px', 
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>총 도크 수</div>
              <div style={{ fontSize: '20px', fontWeight: '700' }}>{station.docks_total}개</div>
            </div>
          </div>

          {latestStatus && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.25)', 
                padding: '24px', 
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
              }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>대여 가능</div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#c6f6d5' }}>
                  {latestStatus.bikes_available}대
                </div>
              </div>
              
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.25)', 
                padding: '24px', 
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
              }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>반납 가능</div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#bee3f8' }}>
                  {latestStatus.docks_available}개
                </div>
              </div>
            </div>
          )}

          {baseline && loadFactor !== undefined && (
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.25)', 
              padding: '24px', 
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>기준 수요</div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>{baseline.baseline_demand}대</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>부하율</div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: '700',
                    color: loadFactor < 0.5 ? '#fed7d7' : loadFactor < 0.8 ? '#feebc8' : loadFactor <= 1.2 ? '#c6f6d5' : '#bee3f8'
                  }}>
                    {(loadFactor * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div style={{ 
                marginTop: '12px',
                padding: '8px 16px',
                background: loadFactor < 0.5 ? 'rgba(220, 53, 69, 0.3)' : 
                           loadFactor < 0.8 ? 'rgba(255, 193, 7, 0.3)' : 
                           loadFactor <= 1.2 ? 'rgba(40, 167, 69, 0.3)' : 
                           'rgba(0, 123, 255, 0.3)',
                borderRadius: '8px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '600',
              }}>
                {loadFactor < 0.5 ? '부족' : loadFactor < 0.8 ? '보통' : loadFactor <= 1.2 ? '양호' : '여유'}
              </div>
            </div>
          )}
        </div>

        {history && history.length > 0 && (
          <div className="card">
            <h2>최근 7일 상태 추이</h2>
            <Line data={chartData} />
          </div>
        )}

        {allBaselines && allBaselines.length > 0 && (
          <div className="card">
            <h2>시간대별 기준 수요</h2>
            <Line data={baselineChartData} />
          </div>
        )}

        {/* 자전거 목록 */}
        <div className="card">
          <h2>자전거 목록 ({bikes?.length || 0}대)</h2>
          {bikes && bikes.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>자전거 ID</th>
                    <th>상태</th>
                    <th>구매일</th>
                  </tr>
                </thead>
                <tbody>
                  {bikes.map((bike: any) => (
                    <tr key={bike.bike_id}>
                      <td>{bike.bike_id}</td>
                      <td>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: 
                            bike.status === 'AVAILABLE' ? '#c6f6d5' :
                            '#fed7d7',
                          color: 
                            bike.status === 'AVAILABLE' ? '#22543d' :
                            '#742a2a',
                        }}>
                          {bike.status === 'AVAILABLE' ? '이용 가능' : '고장'}
                        </span>
                      </td>
                      <td>{bike.purchased_at || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>이 대여소에 등록된 자전거가 없습니다.</p>
          )}
        </div>
      </main>
    </div>
  );
}

