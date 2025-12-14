'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { auth } from '@/lib/auth';

export default function AdminBikesPage() {
  const router = useRouter();
  const [bikes, setBikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterStation, setFilterStation] = useState<string>('ALL');

  useEffect(() => {
    auth.getCurrentUser().then((user) => {
      if (!user || user.role !== 'ADMIN') {
        router.push('/');
        return;
      }
      fetchBikes();
    });
  }, []);

  const fetchBikes = async () => {
    try {
      const response = await api.get('/api/admin/bikes');
      setBikes(response.data.bikes);
    } catch (err) {
      console.error('Failed to fetch bikes:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateBike = async (bikeId: number, stationId: number | null, status: string) => {
    try {
      await api.put(`/api/admin/bikes/${bikeId}`, { stationId, status });
      fetchBikes();
    } catch (err) {
      console.error('Failed to update bike:', err);
      alert('자전거 상태 변경에 실패했습니다.');
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      AVAILABLE: '사용가능',
      IN_USE: '사용 중',
      FAULT: '고장',
      MAINTENANCE: '수리중',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      AVAILABLE: '#28a745',
      IN_USE: '#007bff',
      FAULT: '#dc3545',
      MAINTENANCE: '#ffc107',
    };
    return colors[status] || '#6c757d';
  };

  const filteredBikes = bikes.filter(bike => {
    if (filterStatus !== 'ALL' && bike.status !== filterStatus) return false;
    if (filterStation !== 'ALL' && String(bike.station_id) !== filterStation) return false;
    return true;
  });

  const uniqueStations = Array.from(
    new Map(
      bikes
        .filter(b => b.station_id)
        .map(b => [b.station_id, { id: b.station_id, name: b.station_name }])
    ).values()
  );

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
        <h1 className="page-title">자전거 관리</h1>
        <p style={{ marginBottom: '24px', color: '#718096' }}>
          자전거 ID별로 상태(사용가능, 고장, 수리중, 사용 불가)를 관리할 수 있습니다.
        </p>

        {/* 필터 섹션 */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px' 
          }}>
            <div>
              <label style={{ 
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '8px'
              }}>
                상태 필터
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  color: '#2d3748'
                }}
              >
                <option value="ALL">전체</option>
                <option value="AVAILABLE">사용가능</option>
                <option value="FAULT">고장</option>
                <option value="MAINTENANCE">수리중</option>
                <option value="IN_USE">사용 불가</option>
              </select>
            </div>
            <div>
              <label style={{ 
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '8px'
              }}>
                대여소 필터
              </label>
              <select
                value={filterStation}
                onChange={(e) => setFilterStation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  color: '#2d3748'
                }}
              >
                <option value="ALL">전체</option>
                {uniqueStations.map((station: any) => (
                  <option key={station.id} value={station.id}>
                    {station.name || `대여소 #${station.id}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="main-content">
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div className="table-container">
              <table style={{ margin: 0 }}>
                <thead>
                  <tr style={{ background: '#f7fafc' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#2d3748' }}>자전거 ID</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#2d3748' }}>대여소</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#2d3748' }}>현재 상태</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#2d3748' }}>상태 변경</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#2d3748' }}>구매일</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBikes.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
                        조건에 맞는 자전거가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredBikes.map((bike) => (
                      <tr key={bike.bike_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '16px', fontWeight: '700', color: '#2d3748' }}>
                          #{bike.bike_id}
                        </td>
                        <td style={{ padding: '16px', color: '#4a5568' }}>
                          {bike.station_name || <span style={{ color: '#cbd5e0' }}>-</span>}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '600',
                            backgroundColor: getStatusColor(bike.status) + '20',
                            color: getStatusColor(bike.status),
                            border: `1px solid ${getStatusColor(bike.status)}`
                          }}>
                            {getStatusLabel(bike.status)}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <select
                            value={bike.status}
                            onChange={(e) => updateBike(bike.bike_id, bike.station_id, e.target.value)}
                            style={{
                              padding: '8px 12px',
                              border: '2px solid #e2e8f0',
                              borderRadius: '8px',
                              fontSize: '14px',
                              cursor: 'pointer',
                              backgroundColor: '#fff',
                              color: '#2d3748',
                              fontWeight: '500',
                              minWidth: '140px',
                              transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#007bff'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                          >
                            <option value="AVAILABLE">사용가능</option>
                            <option value="FAULT">고장</option>
                            <option value="MAINTENANCE">수리중</option>
                            <option value="IN_USE">사용 불가</option>
                          </select>
                        </td>
                        <td style={{ padding: '16px', color: '#718096', fontSize: '14px' }}>
                          {bike.purchased_at || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ 
            marginTop: '16px', 
            padding: '12px 16px',
            background: '#f7fafc',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#718096',
            textAlign: 'center'
          }}>
            총 {filteredBikes.length}대 / 전체 {bikes.length}대
          </div>
        </div>
      </main>
    </div>
  );
}

