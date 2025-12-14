'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { auth } from '@/lib/auth';

export default function NewReportPage() {
  const router = useRouter();
  const [stations, setStations] = useState<any[]>([]);
  const [bikes, setBikes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    stationId: '',
    bikeId: '',
    category: '',
    content: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    auth.getCurrentUser().then((user) => {
      if (!user) {
        router.push('/login');
      }
    });
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const response = await api.get('/api/stations');
      setStations(response.data.stations);
    } catch (err) {
      console.error('Failed to fetch stations:', err);
    }
  };

  const fetchBikesForStation = async (stationId: string) => {
    if (!stationId) {
      setBikes([]);
      return;
    }
    try {
      const response = await api.get(`/api/stations/${stationId}`);
      setBikes(response.data.bikes || []);
    } catch (err) {
      console.error('Failed to fetch bikes:', err);
      setBikes([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('stationId', formData.stationId);
      if (formData.bikeId) formDataToSend.append('bikeId', formData.bikeId);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('content', formData.content);

      await api.post('/api/reports', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      router.push('/reports/mine');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
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

      <main className="container" style={{ maxWidth: '700px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '700', 
          color: '#2d3748',
          marginBottom: '32px'
        }}>
          고장 신고
        </h1>
        
        <form onSubmit={handleSubmit}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '8px'
              }}>
                대여소 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <select
                value={formData.stationId}
                onChange={(e) => {
                  setFormData({ ...formData, stationId: e.target.value, bikeId: '' });
                  fetchBikesForStation(e.target.value);
                }}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '15px',
                  backgroundColor: '#fff',
                  color: '#2d3748',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#007bff'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <option value="">선택하세요</option>
                {stations.map((s) => (
                  <option key={s.station_id} value={s.station_id}>
                    {s.station_name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '8px'
              }}>
                자전거 ID <span style={{ color: '#718096', fontWeight: '400' }}>(선택)</span>
              </label>
              {formData.stationId ? (
                <select
                  value={formData.bikeId}
                  onChange={(e) => setFormData({ ...formData, bikeId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    backgroundColor: '#fff',
                    color: '#2d3748',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#007bff'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <option value="">선택하세요</option>
                  {bikes.map((bike) => (
                    <option key={bike.bike_id} value={bike.bike_id}>
                      자전거 ID: {bike.bike_id} ({bike.status === 'AVAILABLE' ? '이용 가능' : '고장'})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  value={formData.bikeId}
                  onChange={(e) => setFormData({ ...formData, bikeId: e.target.value })}
                  placeholder="대여소를 먼저 선택하세요"
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    backgroundColor: '#f7fafc',
                    color: '#718096',
                    cursor: 'not-allowed'
                  }}
                />
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '8px'
              }}>
                카테고리 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '15px',
                  backgroundColor: '#fff',
                  color: '#2d3748',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#007bff'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <option value="">선택하세요</option>
                <option value="BRAKE_ISSUE">브레이크 문제</option>
                <option value="DOCK_FAULT">도크 고장</option>
                <option value="DISPLAY_ERROR">화면 오류</option>
                <option value="OTHER">기타</option>
              </select>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ 
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '8px'
              }}>
                내용 <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '15px',
                  backgroundColor: '#fff',
                  color: '#2d3748',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#007bff'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px 16px',
                background: '#fee',
                color: '#dc3545',
                borderRadius: '8px',
                marginBottom: '24px',
                fontSize: '14px',
                border: '1px solid #fcc'
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Link
                href="/reports/mine"
                style={{
                  padding: '12px 24px',
                  background: '#f7fafc',
                  color: '#2d3748',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '15px',
                  border: '1px solid #e2e8f0',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#edf2f7'}
                onMouseOut={(e) => e.currentTarget.style.background = '#f7fafc'}
              >
                취소
              </Link>
              <button 
                type="submit" 
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: loading ? '#94a3b8' : '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!loading) e.currentTarget.style.background = '#0056b3';
                }}
                onMouseOut={(e) => {
                  if (!loading) e.currentTarget.style.background = '#007bff';
                }}
              >
                {loading ? '제출 중...' : '제출'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

