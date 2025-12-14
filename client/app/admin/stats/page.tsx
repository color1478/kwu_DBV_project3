'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { auth } from '@/lib/auth';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminStatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.getCurrentUser().then((user) => {
      if (!user || user.role !== 'ADMIN') {
        router.push('/');
        return;
      }
      fetchStats();
    });
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container">로딩 중...</div>;
  if (!stats) return null;

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
        <h1 className="page-title">상세 통계 대시보드</h1>

        {/* 통계 카드 그리드 */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-label">총 대여소 수</div>
            <div className="stat-value">
              {stats.stationCongestion.reduce((sum: number, s: any) => sum + s.count, 0)}
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-label">활성 대여소</div>
            <div className="stat-value">
              {stats.stationCongestion.find((s: any) => s.level === 'HIGH')?.count || 0}
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-label">전체 신고</div>
            <div className="stat-value">
              {stats.reportsByStatus.reduce((sum: number, r: any) => sum + r.count, 0)}
            </div>
          </div>
          <div className="stat-card danger">
            <div className="stat-label">완료된 유지보수</div>
            <div className="stat-value">
              {stats.maintenanceByStatus.find((m: any) => m.status === 'DONE')?.count || 0}
            </div>
          </div>
        </div>

        {/* 주요 통계 차트 - Chart.js로 변경 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px', marginBottom: '32px' }}>
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, rgba(220, 53, 69, 0.05) 0%, rgba(220, 53, 69, 0.1) 100%)',
            border: '2px solid rgba(220, 53, 69, 0.2)',
            padding: '32px',
          }}>
            <h2 style={{ 
              marginTop: 0, 
              marginBottom: '24px',
              color: '#dc3545',
              fontSize: '20px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{ fontSize: '28px' }}>📋</span>
              신고 상태별 분포
            </h2>
            <div style={{ height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Doughnut
                data={{
                  labels: stats.reportsByStatus.map((r: any) => r.status),
                  datasets: [{
                    data: stats.reportsByStatus.map((r: any) => r.count),
                    backgroundColor: [
                      'rgba(220, 53, 69, 0.8)',
                      'rgba(237, 137, 54, 0.8)',
                      'rgba(72, 187, 120, 0.8)',
                      'rgba(102, 126, 234, 0.8)',
                    ],
                    borderWidth: 2,
                    borderColor: '#fff',
                  }],
                }}
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
                          return `${label}: ${value}건 (${percentage}%)`;
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="card" style={{ 
            background: 'linear-gradient(135deg, rgba(40, 167, 69, 0.05) 0%, rgba(40, 167, 69, 0.1) 100%)',
            border: '2px solid rgba(40, 167, 69, 0.2)',
            padding: '32px',
          }}>
            <h2 style={{ 
              marginTop: 0, 
              marginBottom: '24px',
              color: '#28a745',
              fontSize: '20px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{ fontSize: '28px' }}>🔧</span>
              유지보수 상태별 분포
            </h2>
            <div style={{ height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Doughnut
                data={{
                  labels: stats.maintenanceByStatus.map((m: any) => m.status),
                  datasets: [{
                    data: stats.maintenanceByStatus.map((m: any) => m.count),
                    backgroundColor: [
                      'rgba(102, 126, 234, 0.8)',
                      'rgba(237, 137, 54, 0.8)',
                      'rgba(72, 187, 120, 0.8)',
                      'rgba(245, 101, 101, 0.8)',
                    ],
                    borderWidth: 2,
                    borderColor: '#fff',
                  }],
                }}
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
                          return `${label}: ${value}건 (${percentage}%)`;
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="card" style={{ 
            background: 'linear-gradient(135deg, rgba(0, 123, 255, 0.05) 0%, rgba(0, 123, 255, 0.1) 100%)',
            border: '2px solid rgba(0, 123, 255, 0.2)',
            padding: '32px',
          }}>
            <h2 style={{ 
              marginTop: 0, 
              marginBottom: '24px',
              color: '#007bff',
              fontSize: '20px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{ fontSize: '28px' }}>🚦</span>
              대여소 혼잡도 분포
            </h2>
            <div style={{ height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Doughnut
                data={{
                  labels: stats.stationCongestion.map((s: any) => s.level),
                  datasets: [{
                    data: stats.stationCongestion.map((s: any) => s.count),
                    backgroundColor: [
                      'rgba(245, 101, 101, 0.8)',
                      'rgba(237, 137, 54, 0.8)',
                      'rgba(72, 187, 120, 0.8)',
                      'rgba(0, 123, 255, 0.8)',
                    ],
                    borderWidth: 2,
                    borderColor: '#fff',
                  }],
                }}
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
                          return `${label}: ${value}개 (${percentage}%)`;
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* 추가 통계 차트 */}
        {stats.stationsByArea && stats.bikeStatus && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            <div className="card">
              <h2>지역별 대여소 수</h2>
              <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Doughnut
                  data={{
                    labels: stats.stationsByArea.map((a: any) => a.area_name),
                    datasets: [{
                      data: stats.stationsByArea.map((a: any) => a.count),
                      backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(237, 137, 54, 0.8)',
                        'rgba(72, 187, 120, 0.8)',
                        'rgba(245, 101, 101, 0.8)',
                        'rgba(118, 75, 162, 0.8)',
                      ],
                      borderWidth: 2,
                      borderColor: '#fff',
                    }],
                  }}
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
                            return `${label}: ${value}개 (${percentage}%)`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
            <div className="card">
              <h2>자전거 상태별 분포</h2>
              <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Doughnut
                  data={{
                    labels: stats.bikeStatus.map((b: any) => 
                      b.status === 'AVAILABLE' ? '이용 가능' :
                      b.status === 'IN_USE' ? '이용 중' :
                      b.status === 'FAULT' ? '고장' : '정비 중'
                    ),
                    datasets: [{
                      data: stats.bikeStatus.map((b: any) => b.count),
                      backgroundColor: [
                        'rgba(40, 167, 69, 0.8)',
                        'rgba(0, 123, 255, 0.8)',
                        'rgba(220, 53, 69, 0.8)',
                        'rgba(253, 126, 20, 0.8)',
                      ],
                      borderWidth: 2,
                      borderColor: '#fff',
                    }],
                  }}
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
                            return `${label}: ${value}대 (${percentage}%)`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 상세 통계 테이블 */}
        <div className="main-content">
          <h2>신고 통계 상세</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>상태</th>
                  <th>건수</th>
                  <th>비율</th>
                </tr>
              </thead>
              <tbody>
                {stats.reportsByStatus.map((r: any) => {
                  const total = stats.reportsByStatus.reduce((sum: number, item: any) => sum + item.count, 0);
                  const percentage = total > 0 ? ((r.count / total) * 100).toFixed(1) : 0;
                  return (
                    <tr key={r.status}>
                      <td>{r.status}</td>
                      <td>{r.count}건</td>
                      <td>{percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="main-content" style={{ marginTop: '24px' }}>
          <h2>유지보수 통계 상세</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>상태</th>
                  <th>건수</th>
                  <th>비율</th>
                </tr>
              </thead>
              <tbody>
                {stats.maintenanceByStatus.map((m: any) => {
                  const total = stats.maintenanceByStatus.reduce((sum: number, item: any) => sum + item.count, 0);
                  const percentage = total > 0 ? ((m.count / total) * 100).toFixed(1) : 0;
                  return (
                    <tr key={m.status}>
                      <td>{m.status}</td>
                      <td>{m.count}건</td>
                      <td>{percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {stats.stationsByArea && (
          <div className="main-content" style={{ marginTop: '24px' }}>
            <h2>지역별 대여소 통계</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>지역</th>
                    <th>대여소 수</th>
                    <th>비율</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.stationsByArea.map((area: any) => {
                    const total = stats.stationsByArea.reduce((sum: number, a: any) => sum + a.count, 0);
                    const percentage = total > 0 ? ((area.count / total) * 100).toFixed(1) : 0;
                    return (
                      <tr key={area.area_name}>
                        <td>{area.area_name}</td>
                        <td>{area.count}개</td>
                        <td>{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {stats.bikeStatus && (
          <div className="main-content" style={{ marginTop: '24px' }}>
            <h2>자전거 상태별 통계</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>상태</th>
                    <th>대수</th>
                    <th>비율</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.bikeStatus.map((bike: any) => {
                    const total = stats.bikeStatus.reduce((sum: number, item: any) => sum + item.count, 0);
                    const percentage = total > 0 ? ((bike.count / total) * 100).toFixed(1) : 0;
                    const statusLabel = 
                      bike.status === 'AVAILABLE' ? '이용 가능' :
                      bike.status === 'IN_USE' ? '이용 중' :
                      bike.status === 'FAULT' ? '고장' : '정비 중';
                    return (
                      <tr key={bike.status}>
                        <td>{statusLabel}</td>
                        <td>{bike.count}대</td>
                        <td>{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

