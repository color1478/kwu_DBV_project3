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
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import dynamic from 'next/dynamic';

const D3AdminChart = dynamic(() => import('@/components/D3AdminChart'), {
  ssr: false,
});

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AdminDashboard() {
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

  const handleLogout = async () => {
    try {
      await auth.logout();
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  if (loading) return <div className="container">로딩 중...</div>;
  if (!stats) return null;

  const rentalsChartData = {
    labels: stats.rentalsLast7Days.map((r: any) => r.date),
    datasets: [
      {
        label: '대여 수',
        data: stats.rentalsLast7Days.map((r: any) => r.count),
        backgroundColor: 'rgba(102, 126, 234, 0.6)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const reportsChartData = {
    labels: stats.reportsByStatus.map((r: any) => r.status),
    datasets: [
      {
        data: stats.reportsByStatus.map((r: any) => r.count),
        backgroundColor: [
          'rgba(102, 126, 234, 0.8)',
          'rgba(237, 137, 54, 0.8)',
          'rgba(72, 187, 120, 0.8)',
          'rgba(245, 101, 101, 0.8)',
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const maintenanceChartData = {
    labels: stats.maintenanceByStatus.map((m: any) => m.status),
    datasets: [
      {
        data: stats.maintenanceByStatus.map((m: any) => m.count),
        backgroundColor: [
          'rgba(102, 126, 234, 0.8)',
          'rgba(237, 137, 54, 0.8)',
          'rgba(72, 187, 120, 0.8)',
          'rgba(245, 101, 101, 0.8)',
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const congestionChartData = {
    labels: stats.stationCongestion.map((s: any) => s.level),
    datasets: [
      {
        data: stats.stationCongestion.map((s: any) => s.count),
        backgroundColor: [
          'rgba(245, 101, 101, 0.8)',
          'rgba(237, 137, 54, 0.8)',
          'rgba(72, 187, 120, 0.8)',
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
  };

  return (
    <div>
      <header className="header">
        <div className="container">
          <nav>
            <div>
              <Link href="/">SD (Ddarungi) Insight</Link>
            </div>
            <div>
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  background: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#c82333'}
                onMouseOut={(e) => e.currentTarget.style.background = '#dc3545'}
              >
                로그아웃
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="container">
        <h1 className="page-title">관리자 대시보드</h1>

        {/* 통계 카드 */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-label">전체 사용자</div>
            <div className="stat-value">{stats.userStats?.total_users || 0}</div>
            <div style={{ fontSize: '12px', color: '#718096', marginTop: '8px' }}>
              활성: {stats.userStats?.active_users || 0}명
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-label">총 대여 수</div>
            <div className="stat-value">
              {stats.rentalsLast7Days.reduce((sum: number, r: any) => sum + r.count, 0)}
            </div>
            <div style={{ fontSize: '12px', color: '#718096', marginTop: '8px' }}>
              최근 7일
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-label">신고 접수</div>
            <div className="stat-value">
              {stats.reportsByStatus.reduce((sum: number, r: any) => sum + r.count, 0)}
            </div>
            <div style={{ fontSize: '12px', color: '#718096', marginTop: '8px' }}>
              전체 신고
            </div>
          </div>
          <div className="stat-card danger">
            <div className="stat-label">대여소 수</div>
            <div className="stat-value">
              {stats.stationCongestion.reduce((sum: number, s: any) => sum + s.count, 0)}
            </div>
            <div style={{ fontSize: '12px', color: '#718096', marginTop: '8px' }}>
              활성 대여소
            </div>
          </div>
        </div>

        {/* 관리 메뉴 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <Link href="/admin/users" className="card" style={{ textAlign: 'center', textDecoration: 'none' }}>
            <h3 style={{ margin: 0 }}>👥 회원 관리</h3>
          </Link>
          <Link href="/admin/stations" className="card" style={{ textAlign: 'center', textDecoration: 'none' }}>
            <h3 style={{ margin: 0 }}>📍 대여소 관리</h3>
          </Link>
          <Link href="/admin/bikes" className="card" style={{ textAlign: 'center', textDecoration: 'none' }}>
            <h3 style={{ margin: 0 }}>🚲 자전거 관리</h3>
            <p style={{ fontSize: '12px', color: '#718096', marginTop: '8px' }}>
              이용 중, 고장, 정비 중 관리
            </p>
          </Link>
          <Link href="/admin/reports" className="card" style={{ textAlign: 'center', textDecoration: 'none' }}>
            <h3 style={{ margin: 0 }}>📋 신고 및 정비 관리</h3>
            <p style={{ fontSize: '12px', color: '#718096', marginTop: '8px' }}>
              신고 검증, 유지보수 배정
            </p>
          </Link>
          <Link href="/admin/rebalancing" className="card" style={{ textAlign: 'center', textDecoration: 'none' }}>
            <h3 style={{ margin: 0 }}>🔄 재배치 관리</h3>
            <p style={{ fontSize: '12px', color: '#718096', marginTop: '8px' }}>
              자동 재배치 추천
            </p>
          </Link>
          <Link href="/admin/stats" className="card" style={{ textAlign: 'center', textDecoration: 'none' }}>
            <h3 style={{ margin: 0 }}>📊 상세 통계</h3>
            <p style={{ fontSize: '12px', color: '#718096', marginTop: '8px' }}>
              추가 통계 및 분석
            </p>
          </Link>
          <Link href="/admin/stations-map" className="card" style={{ textAlign: 'center', textDecoration: 'none' }}>
            <h3 style={{ margin: 0 }}>🗺️ 이용률 지도</h3>
            <p style={{ fontSize: '12px', color: '#718096', marginTop: '8px' }}>
              평소 이용률 대비 색상 표시
            </p>
          </Link>
          <Link href="/admin/community" className="card" style={{ textAlign: 'center', textDecoration: 'none' }}>
            <h3 style={{ margin: 0 }}>💬 커뮤니티 관리</h3>
            <p style={{ fontSize: '12px', color: '#718096', marginTop: '8px' }}>
              게시글 삭제 관리
            </p>
          </Link>
        </div>

        {/* 대여소 이용률 지도 링크 */}
        <div className="card" style={{ marginBottom: '24px', textAlign: 'center', padding: '24px', background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' }}>
          <Link href="/admin/stations-map" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h2 style={{ margin: '0 0 12px 0' }}>🗺️ 대여소 이용률 지도 보기</h2>
            <p style={{ color: '#718096', margin: 0 }}>
              평소 이용률 대비 현재 자전거 배치율을 색상으로 표시한 지도를 확인하세요.
            </p>
          </Link>
        </div>

        {/* 차트 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <div className="card">
            <h2>최근 7일 대여 통계</h2>
            <div style={{ height: '300px' }}>
              <Bar data={rentalsChartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

