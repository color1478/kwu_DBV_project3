'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { auth } from '@/lib/auth';

export default function AdminStationsPage() {
  const router = useRouter();
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    areaId: '',
    stationName: '',
    latitude: '',
    longitude: '',
    docksTotal: '',
  });

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
      const response = await api.get('/api/admin/stations');
      setStations(response.data.stations);
    } catch (err) {
      console.error('Failed to fetch stations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/stations', formData);
      setShowForm(false);
      setFormData({
        areaId: '',
        stationName: '',
        latitude: '',
        longitude: '',
        docksTotal: '',
      });
      fetchStations();
    } catch (err) {
      console.error('Failed to create station:', err);
    }
  };

  const toggleStationActive = async (stationId: number, currentStatus: boolean) => {
    try {
      await api.put(`/api/admin/stations/${stationId}/active`, {
        isActive: !currentStatus
      });
      fetchStations();
    } catch (err) {
      console.error('Failed to toggle station status:', err);
      alert('상태 변경에 실패했습니다.');
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 className="page-title">대여소 관리</h1>
            <p style={{ color: '#718096', marginTop: '8px' }}>
              대여소를 추가, 수정하고 활성/비활성화할 수 있습니다.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '취소' : '새 대여소 추가'}
          </button>
        </div>

        {showForm && (
          <div className="card">
            <h2>새 대여소 추가</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>지역 ID</label>
                <input
                  type="number"
                  value={formData.areaId}
                  onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>대여소 이름</label>
                <input
                  type="text"
                  value={formData.stationName}
                  onChange={(e) => setFormData({ ...formData, stationName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>위도</label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>경도</label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>총 도크 수</label>
                <input
                  type="number"
                  value={formData.docksTotal}
                  onChange={(e) => setFormData({ ...formData, docksTotal: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">생성</button>
            </form>
          </div>
        )}

        <div className="main-content">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>이름</th>
                  <th>지역</th>
                  <th>위치</th>
                  <th>도크 수</th>
                  <th>대여 가능</th>
                  <th>반납 가능</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {stations.map((station) => (
                  <tr key={station.station_id}>
                    <td>{station.station_id}</td>
                    <td style={{ fontWeight: '600' }}>{station.station_name}</td>
                    <td>{station.area_name}</td>
                    <td style={{ fontSize: '12px', color: '#718096' }}>
                      {parseFloat(station.latitude).toFixed(4)}, {parseFloat(station.longitude).toFixed(4)}
                    </td>
                    <td>{station.docks_total}</td>
                    <td style={{ color: '#48bb78', fontWeight: '600' }}>{station.bikes_available || 0}</td>
                    <td style={{ color: '#4299e1', fontWeight: '600' }}>{station.docks_available || 0}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: station.is_active ? '#c6f6d5' : '#fed7d7',
                          color: station.is_active ? '#22543d' : '#742a2a',
                        }}>
                          {station.is_active ? '활성' : '비활성'}
                        </span>
                        <button
                          onClick={() => toggleStationActive(station.station_id, station.is_active)}
                          style={{
                            padding: '6px 12px',
                            background: station.is_active ? '#dc3545' : '#28a745',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = station.is_active ? '#c82333' : '#218838';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = station.is_active ? '#dc3545' : '#28a745';
                          }}
                        >
                          {station.is_active ? '비활성화' : '활성화'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

