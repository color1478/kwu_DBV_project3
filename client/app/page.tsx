'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { auth } from '@/lib/auth';

// Leaflet은 클라이언트 사이드에서만 로드
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
});

// D3 시각화
const D3Visualization = dynamic(() => import('@/components/D3Visualization'), {
  ssr: false,
});

interface Station {
  station_id: number;
  station_name: string;
  latitude: number;
  longitude: number;
  distance?: number;
  bikes_available: number;
  docks_available: number;
  baseline_demand?: number;
  load_factor?: number;
  color?: string;
}

export default function Home() {
  const router = useRouter();
  const [stations, setStations] = useState<Station[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [selectedStation, setSelectedStation] = useState<number | null>(null);

  useEffect(() => {
    auth.getCurrentUser().then(setUser);
  }, []);

  useEffect(() => {
    // 로그인하지 않은 사용자 또는 관리자는 서울 중심으로 설정하고 모든 대여소 표시
    if (!user || user.role === 'ADMIN') {
      setUserLocation({ lat: 37.5665, lng: 126.9780 });
      return;
    }

    // 로그인한 일반 사용자만 위치 정보 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.error('Geolocation error:', err);
          // Default to Seoul center
          setUserLocation({ lat: 37.5665, lng: 126.9780 });
        }
      );
    } else {
      // Default to Seoul center
      setUserLocation({ lat: 37.5665, lng: 126.9780 });
    }
  }, [user]);

  useEffect(() => {
    if (userLocation) {
      fetchStations();
    }
  }, [userLocation, radius, user]);

  const fetchStations = async () => {
    if (!userLocation) return;

    try {
      setLoading(true);
      
      // 로그인하지 않은 사용자 또는 관리자는 모든 대여소 조회
      // 로그인한 일반 사용자는 근처 대여소 조회
      if (!user || (user && user.role === 'ADMIN')) {
        const response = await api.get('/api/stations');
        setStations(response.data.stations);
      } else {
        const response = await api.get('/api/stations/nearby', {
          params: {
            lat: userLocation.lat,
            lng: userLocation.lng,
            radius,
          },
        });
        setStations(response.data.stations);
      }
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch stations');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
      setUser(null);
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  return (
    <div>
      <header className="header">
        <div className="container">
          <nav>
            <div>
              <Link href="/">SD (Ddarungi) Insight</Link>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {user ? (
                <>
                  {user.role === 'ADMIN' ? (
                    <>
                      <Link href="/admin">관리자 대시보드</Link>
                      <Link href="/community">커뮤니티</Link>
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
                    </>
                  ) : (
                    <>
                      <Link href="/mypage">마이페이지</Link>
                      <Link href="/favorites">즐겨찾기</Link>
                      <Link href="/community">커뮤니티</Link>
                      <Link href="/reports/mine">내 신고</Link>
                      <Link href="/congestion">혼잡도 예측</Link>
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
                    </>
                  )}
                </>
              ) : (
                <>
                  <Link href="/login">로그인</Link>
                  <Link href="/register">회원가입</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="container">
        <h1 className="page-title">대여소 탐색</h1>

        <div className="main-content">
          {/* 컨트롤 패널 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px',
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            borderRadius: '12px',
          }}>
            {user && user.role !== 'ADMIN' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontWeight: '600', color: '#2d3748' }}>반경 (km):</label>
                <input
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={radius}
                  onChange={(e) => setRadius(parseFloat(e.target.value))}
                  style={{
                    width: '100px',
                    padding: '10px 12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                />
              </div>
            )}
            {user && user.role === 'ADMIN' && (
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#2d3748' }}>
                전체 대여소 현황
              </div>
            )}
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#718096', marginBottom: '8px' }}>범례</div>
              <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="station-marker red"></span>
                  <span style={{ color: '#2d3748' }}>부족</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="station-marker orange"></span>
                  <span style={{ color: '#2d3748' }}>보통</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="station-marker green"></span>
                  <span style={{ color: '#2d3748' }}>양호</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="station-marker blue"></span>
                  <span style={{ color: '#2d3748' }}>여유</span>
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
              <div style={{ fontSize: '18px' }}>로딩 중...</div>
            </div>
          )}
          {error && (
            <div style={{
              padding: '16px',
              background: '#fed7d7',
              color: '#742a2a',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              오류: {error}
            </div>
          )}

          {/* D3 시각화 - 로그인한 사용자만 표시 */}
          {user && !loading && stations.length > 0 && (
            <D3Visualization stations={stations} />
          )}

          {/* 지도 뷰 */}
          {userLocation && !loading && (
            <MapView
              stations={stations}
              userLocation={userLocation}
              selectedStation={selectedStation}
              onStationClick={(stationId) => {
                router.push(`/station/${stationId}`);
              }}
              showUserLocation={user && user.role !== 'ADMIN' && user !== null}
              radius={user && user.role !== 'ADMIN' && user !== null ? radius : undefined}
            />
          )}

          {/* 대여소 목록 */}
          {!loading && (
            <div style={{ marginTop: '32px' }}>
              <h2 style={{ marginBottom: '20px', color: '#1a202c' }}>
                대여소 목록 <span style={{ color: '#4a5568', fontWeight: '700' }}>({stations.length}개)</span>
              </h2>
              {stations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                  반경 내 대여소가 없습니다.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {stations.map((station) => (
                    <div
                      key={station.station_id}
                      className="card"
                      style={{
                        cursor: 'pointer',
                        border: selectedStation === station.station_id ? '2px solid #4a5568' : '1px solid rgba(0, 0, 0, 0.05)',
                      }}
                      onClick={() => router.push(`/station/${station.station_id}`)}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <span className={`station-marker ${station.color || 'blue'}`} style={{ marginTop: '4px' }}></span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1a202c' }}>
                              {station.station_name}
                            </h3>
                            {user && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const isFavorite = station.is_favorite;
                                    if (isFavorite) {
                                      await api.delete(`/api/favorites/${station.station_id}`);
                                    } else {
                                      await api.post('/api/favorites', { stationId: station.station_id });
                                    }
                                    // Refresh stations
                                    fetchStations();
                                  } catch (err) {
                                    console.error('Failed to toggle favorite:', err);
                                  }
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '24px',
                                  padding: '4px',
                                  color: station.is_favorite ? '#ffc107' : 'transparent',
                                  WebkitTextStroke: station.is_favorite ? 'none' : '1px #cbd5e0',
                                  transition: 'all 0.2s',
                                }}
                                title={station.is_favorite ? '즐겨찾기 제거' : '즐겨찾기 추가'}
                              >
                                ⭐
                              </button>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                              <span style={{ color: '#718096' }}>거리:</span>
                              <span style={{ fontWeight: '600', color: '#2d3748' }}>{station.distance?.toFixed(2)} km</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                              <span style={{ color: '#718096' }}>대여 가능:</span>
                              <span style={{ fontWeight: '600', color: '#48bb78' }}>{station.bikes_available}대</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                              <span style={{ color: '#718096' }}>반납 가능:</span>
                              <span style={{ fontWeight: '600', color: '#4299e1' }}>{station.docks_available}개</span>
                            </div>
                            {station.load_factor !== undefined && station.load_factor !== null && (
                              <div style={{ 
                                marginTop: '8px',
                                padding: '8px',
                                background: station.load_factor < 0.5 ? '#dc3545' : station.load_factor < 0.8 ? '#ffc107' : station.load_factor <= 1.2 ? '#28a745' : '#007bff',
                                borderRadius: '6px',
                                fontSize: '13px',
                                textAlign: 'center',
                                fontWeight: '600',
                                color: 'white',
                              }}>
                                부하율: {(station.load_factor * 100).toFixed(1)}%
                                <span style={{ marginLeft: '8px', fontSize: '11px', opacity: 0.9 }}>
                                  ({station.load_factor < 0.5 ? '부족' : station.load_factor < 0.8 ? '보통' : station.load_factor <= 1.2 ? '양호' : '여유'})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

