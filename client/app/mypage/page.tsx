'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { auth } from '@/lib/auth';

export default function MyPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.getCurrentUser().then((user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      fetchData();
    });
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/api/mypage');
      setData(response.data);
    } catch (err) {
      console.error('Failed to fetch mypage data:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAlertRead = async (alertId: number) => {
    try {
      await api.put(`/api/mypage/alerts/${alertId}/read`);
      fetchData();
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
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
  if (!data) return null;

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
        <h1>마이페이지</h1>

        <div className="card">
          <h2>프로필</h2>
          <p>이메일: {data.user.email}</p>
          <p>닉네임: {data.user.nickname || '없음'}</p>
          <p>역할: {data.user.role}</p>
          <p>가입일: {new Date(data.user.created_at).toLocaleString()}</p>
        </div>

        <div className="card">
          <h2>알림 ({data.alerts.filter((a: any) => !a.is_read).length}개 미읽음)</h2>
          {data.alerts.length === 0 ? (
            <p>알림이 없습니다.</p>
          ) : (
            <div>
              {data.alerts.map((alert: any) => (
                <div key={alert.alert_id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                  <p>{alert.message}</p>
                  <p style={{ fontSize: '12px', color: '#666' }}>
                    {new Date(alert.created_at).toLocaleString()}
                    {!alert.is_read && (
                      <button
                        className="btn btn-secondary"
                        style={{ marginLeft: '10px', padding: '5px 10px' }}
                        onClick={() => markAlertRead(alert.alert_id)}
                      >
                        읽음 처리
                      </button>
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2>대여 내역</h2>
          {data.rentals.length === 0 ? (
            <p>대여 내역이 없습니다.</p>
          ) : (
            <div>
              {data.rentals.map((rental: any) => (
                <div key={rental.rental_id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                  <p>출발: {rental.start_station_name}</p>
                  <p>도착: {rental.end_station_name || '진행 중'}</p>
                  <p>요금: {rental.fee}원</p>
                  <p>시작: {new Date(rental.start_time).toLocaleString()}</p>
                  {rental.end_time && (
                    <p>종료: {new Date(rental.end_time).toLocaleString()}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2>즐겨찾기</h2>
          {data.favorites.length === 0 ? (
            <p>즐겨찾기가 없습니다.</p>
          ) : (
            <div>
              {data.favorites.map((fav: any) => (
                <div key={fav.fav_id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                  <Link href={`/station/${fav.station_id}`}>{fav.station_name}</Link>
                  <p>지역: {fav.area_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2>내 신고</h2>
          <Link href="/reports/mine">신고 내역 보기</Link>
        </div>

        <div className="card">
          <h2>획득한 배지 (스탬프)</h2>
          {data.achievements.length === 0 ? (
            <p>획득한 배지가 없습니다. 고장 신고를 통해 배지를 획득하세요!</p>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
              gap: '20px',
              marginTop: '20px'
            }}>
              {data.achievements.map((ach: any) => (
                <div 
                  key={ach.achv_id} 
                  style={{ 
                    textAlign: 'center',
                    padding: '20px',
                    border: '3px solid #4a5568',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
                  }}
                >
                  <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 12px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    color: 'white',
                    fontWeight: '700',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  }}>
                    {ach.code === 'FIRST_REPORT' ? '1️⃣' :
                     ach.code === 'REPORT_DETECTIVE' ? '🔍' :
                     ach.code === 'REPORT_PARTNER' ? '🤝' :
                     ach.code === 'ENV_PROTECTOR_1' ? '🌱' :
                     ach.code === 'ENV_PROTECTOR_2' ? '🌿' :
                     ach.code === 'ENV_PROTECTOR_3' ? '🌳' :
                     ach.code === 'BALANCER_1' ? '⚖️' :
                     ach.code === 'BALANCER_2' ? '⚖️' :
                     ach.code === 'BALANCER_3' ? '⚖️' : '🏆'}
                  </div>
                  <p style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>{ach.name}</p>
                  <p style={{ fontSize: '11px', color: '#718096' }}>
                    {new Date(ach.awarded_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
          
          {/* 배지 진행도 표시 */}
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: '700' }}>배지 진행도</h3>
            
            {/* 신고 배지 */}
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f7fafc', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: '600', color: '#4a5568' }}>신고 배지</h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[
                  { code: 'FIRST_REPORT', name: '첫 신고 기여', count: 1 },
                  { code: 'REPORT_DETECTIVE', name: '현장 탐정', count: 3 },
                  { code: 'REPORT_PARTNER', name: '정비 파트너', count: 5 },
                ].map((badge) => {
                  const hasBadge = data.achievements.some((a: any) => a.code === badge.code);
                  // 신고 개수 (검증 여부와 관계없이 전체 신고 수)
                  const reportCount = data.reports.length;
                  const progress = Math.min((reportCount / badge.count) * 100, 100);
                  
                  return (
                    <div 
                      key={badge.code}
                      style={{
                        flex: '1',
                        minWidth: '120px',
                        padding: '12px',
                        border: hasBadge ? '2px solid #28a745' : '2px solid #e2e8f0',
                        borderRadius: '8px',
                        background: hasBadge ? '#c6f6d5' : 'white',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                        {badge.name} ({badge.count}회)
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '8px', 
                        background: '#e2e8f0', 
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${progress}%`,
                          height: '100%',
                          background: hasBadge ? '#28a745' : '#4a5568',
                          transition: 'width 0.3s',
                        }}></div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#718096', marginTop: '4px' }}>
                        {reportCount}/{badge.count}회 {hasBadge && '✓'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 환경 보호자 배지 */}
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f7fafc', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: '600', color: '#4a5568' }}>환경 보호자 (대여 횟수)</h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[
                  { code: 'ENV_PROTECTOR_1', name: '환경 보호자 1단계', count: 5 },
                  { code: 'ENV_PROTECTOR_2', name: '환경 보호자 2단계', count: 10 },
                  { code: 'ENV_PROTECTOR_3', name: '환경 보호자 3단계', count: 20 },
                ].map((badge) => {
                  const hasBadge = data.achievements.some((a: any) => a.code === badge.code);
                  const rentalCount = data.rentals.length;
                  const progress = Math.min((rentalCount / badge.count) * 100, 100);
                  
                  return (
                    <div 
                      key={badge.code}
                      style={{
                        flex: '1',
                        minWidth: '120px',
                        padding: '12px',
                        border: hasBadge ? '2px solid #28a745' : '2px solid #e2e8f0',
                        borderRadius: '8px',
                        background: hasBadge ? '#c6f6d5' : 'white',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                        {badge.name} ({badge.count}회)
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '8px', 
                        background: '#e2e8f0', 
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${progress}%`,
                          height: '100%',
                          background: hasBadge ? '#28a745' : '#4a5568',
                          transition: 'width 0.3s',
                        }}></div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#718096', marginTop: '4px' }}>
                        {rentalCount}/{badge.count}회 {hasBadge && '✓'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 균형자 배지 */}
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f7fafc', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: '600', color: '#4a5568' }}>균형자 (부족 대여소 반납)</h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[
                  { code: 'BALANCER_1', name: '균형자 1단계', count: 1 },
                  { code: 'BALANCER_2', name: '균형자 2단계', count: 5 },
                  { code: 'BALANCER_3', name: '균형자 3단계', count: 10 },
                ].map((badge) => {
                  const hasBadge = data.achievements.some((a: any) => a.code === badge.code);
                  // Note: 실제 부족 대여소 반납 횟수는 서버에서 계산 필요
                  const lowStationReturns = 0; // TODO: 서버에서 계산
                  const progress = Math.min((lowStationReturns / badge.count) * 100, 100);
                  
                  return (
                    <div 
                      key={badge.code}
                      style={{
                        flex: '1',
                        minWidth: '120px',
                        padding: '12px',
                        border: hasBadge ? '2px solid #28a745' : '2px solid #e2e8f0',
                        borderRadius: '8px',
                        background: hasBadge ? '#c6f6d5' : 'white',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                        {badge.name} ({badge.count}회)
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '8px', 
                        background: '#e2e8f0', 
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${progress}%`,
                          height: '100%',
                          background: hasBadge ? '#28a745' : '#4a5568',
                          transition: 'width 0.3s',
                        }}></div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#718096', marginTop: '4px' }}>
                        {lowStationReturns}/{badge.count}회 {hasBadge && '✓'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

