'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { auth } from '@/lib/auth';

export default function CongestionPage() {
  const router = useRouter();
  const [predictions, setPredictions] = useState<any[]>([]);
  const [targetHour, setTargetHour] = useState(new Date().getHours() + 1);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    auth.getCurrentUser().then((u) => {
      if (!u) {
        router.push('/login');
        return;
      }
      setUser(u);
    });
  }, []);

  const searchPredictions = async () => {
    setSearching(true);
    try {
      const response = await api.get('/api/stations/congestion/all', {
        params: { targetHour }
      });
      setPredictions(response.data.predictions || []);
    } catch (err) {
      console.error('Failed to get predictions:', err);
      alert('예측 조회에 실패했습니다.');
    } finally {
      setSearching(false);
    }
  };

  const getLoadFactorColor = (status: string) => {
    switch (status) {
      case '부족':
        return '#dc3545'; // 빨간색
      case '보통':
        return '#ffc107'; // 노란색
      case '양호':
        return '#28a745'; // 초록색
      case '여유':
        return '#007bff'; // 파란색
      default:
        return '#6c757d';
    }
  };

  const getLoadFactorBgColor = (status: string) => {
    switch (status) {
      case '부족':
        return '#fee';
      case '보통':
        return '#fff8e1';
      case '양호':
        return '#e8f5e9';
      case '여유':
        return '#e3f2fd';
      default:
        return '#f5f5f5';
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

      <main className="container">
        <h1 className="page-title">혼잡도 예측</h1>
        <p style={{ marginBottom: '20px', color: '#718096' }}>
          시간대별 대여 패턴을 분석해 대여소의 혼잡도를 예측하고, 이용하기 좋은 대여소를 추천합니다.
        </p>

        <div className="main-content">
          <div style={{ 
            marginBottom: '24px', 
            padding: '20px', 
            background: '#fff', 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-end',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ 
                display: 'block', 
                fontWeight: '600', 
                marginBottom: '8px',
                color: '#2d3748'
              }}>
                예측 시간
              </label>
              <select
                value={targetHour}
                onChange={(e) => setTargetHour(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                }}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i}시
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-primary"
              onClick={searchPredictions}
              disabled={searching}
              style={{
                padding: '10px 24px',
                fontSize: '16px',
                fontWeight: '600',
                minWidth: '150px'
              }}
            >
              {searching ? '검색 중...' : '예측 대여소 검색'}
            </button>
          </div>

          {predictions.length > 0 && (
            <div style={{ 
              background: '#fff', 
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <div style={{ 
                padding: '16px 20px', 
                background: '#f7fafc', 
                borderBottom: '1px solid #e2e8f0',
                fontWeight: '600',
                fontSize: '16px',
                color: '#2d3748'
              }}>
                예측 결과 ({targetHour}시 기준)
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{ 
                      background: '#f7fafc',
                      borderBottom: '2px solid #e2e8f0'
                    }}>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#4a5568'
                      }}>
                        예측 대여소
                      </th>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#4a5568'
                      }}>
                        지역
                      </th>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#4a5568'
                      }}>
                        예측 대여 가능 수
                      </th>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#4a5568'
                      }}>
                        예상 부하율
                      </th>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#4a5568'
                      }}>
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((pred, index) => (
                      <tr 
                        key={pred.station_id}
                        style={{ 
                          borderBottom: '1px solid #e2e8f0',
                          backgroundColor: index % 2 === 0 ? '#fff' : '#f9fafb'
                        }}
                      >
                        <td style={{ 
                          padding: '12px 16px',
                          fontWeight: '500',
                          color: '#2d3748'
                        }}>
                          {pred.station_name}
                        </td>
                        <td style={{ 
                          padding: '12px 16px',
                          color: '#718096'
                        }}>
                          {pred.area_name}
                        </td>
                        <td style={{ 
                          padding: '12px 16px',
                          textAlign: 'center',
                          fontWeight: '600',
                          color: '#2d3748'
                        }}>
                          {pred.predicted_bikes_available}대
                        </td>
                        <td style={{ 
                          padding: '12px 16px',
                          textAlign: 'center',
                          fontWeight: '600',
                          color: '#2d3748'
                        }}>
                          {(pred.predicted_load_factor * 100).toFixed(1)}%
                        </td>
                        <td style={{ 
                          padding: '12px 16px',
                          textAlign: 'center'
                        }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: getLoadFactorBgColor(pred.load_factor_status),
                            color: getLoadFactorColor(pred.load_factor_status),
                            border: `1px solid ${getLoadFactorColor(pred.load_factor_status)}`
                          }}>
                            {pred.load_factor_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {predictions.length === 0 && !searching && (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              color: '#718096',
              background: '#fff',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              예측 시간을 선택하고 "예측 대여소 검색" 버튼을 클릭하세요.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

