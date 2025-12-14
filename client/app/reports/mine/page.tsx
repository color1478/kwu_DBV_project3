'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { auth } from '@/lib/auth';

export default function MyReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.getCurrentUser().then((user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      fetchReports();
    });
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/api/reports/mine');
      setReports(response.data.reports);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      RECEIVED: '접수됨',
      IN_PROGRESS: '진행 중',
      DONE: '완료',
      REJECTED: '거부됨',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      RECEIVED: '#007bff',
      IN_PROGRESS: '#ffc107',
      DONE: '#28a745',
      REJECTED: '#dc3545',
    };
    return colors[status] || '#6c757d';
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      BRAKE_ISSUE: '브레이크 문제',
      DOCK_FAULT: '도크 고장',
      DISPLAY_ERROR: '화면 오류',
      OTHER: '기타',
    };
    return labels[category] || category;
  };

  if (loading) return <div className="container">로딩 중...</div>;

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
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#2d3748',
            margin: 0
          }}>
            내 신고
          </h1>
          <Link 
            href="/reports/new" 
            style={{ 
              padding: '12px 24px',
              background: '#2d3748',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '8px 8px 0 0',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'background 0.2s',
              display: 'inline-block'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#1a202c'}
            onMouseOut={(e) => e.currentTarget.style.background = '#2d3748'}
          >
            새 신고 작성
          </Link>
        </div>

        {reports.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '60px 40px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <p style={{ 
              fontSize: '18px', 
              color: '#718096',
              margin: 0
            }}>
              신고 내역이 없습니다.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {reports.map((report) => (
              <div 
                key={report.report_id} 
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e2e8f0',
                  transition: 'box-shadow 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <h3 style={{ 
                    fontSize: '20px', 
                    fontWeight: '700', 
                    color: '#2d3748',
                    margin: 0
                  }}>
                    신고 #{report.report_id}
                  </h3>
                  <span style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    backgroundColor: getStatusColor(report.status),
                    color: '#fff'
                  }}>
                    {getStatusLabel(report.status)}
                  </span>
                </div>

                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  <div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#718096',
                      marginBottom: '4px',
                      fontWeight: '600'
                    }}>
                      대여소
                    </div>
                    <div style={{ 
                      fontSize: '15px', 
                      color: '#2d3748',
                      fontWeight: '500'
                    }}>
                      {report.station_name}
                    </div>
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#718096',
                      marginBottom: '4px',
                      fontWeight: '600'
                    }}>
                      카테고리
                    </div>
                    <div style={{ 
                      fontSize: '15px', 
                      color: '#2d3748',
                      fontWeight: '500'
                    }}>
                      {getCategoryLabel(report.category)}
                    </div>
                  </div>
                  {report.is_valid !== null && (
                    <div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#718096',
                        marginBottom: '4px',
                        fontWeight: '600'
                      }}>
                        검증
                      </div>
                      <div style={{ 
                        fontSize: '15px', 
                        color: report.is_valid ? '#28a745' : '#dc3545',
                        fontWeight: '600'
                      }}>
                        {report.is_valid ? '유효' : '무효'}
                      </div>
                    </div>
                  )}
                  <div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#718096',
                      marginBottom: '4px',
                      fontWeight: '600'
                    }}>
                      작성일
                    </div>
                    <div style={{ 
                      fontSize: '15px', 
                      color: '#2d3748',
                      fontWeight: '500'
                    }}>
                      {new Date(report.created_at).toLocaleString('ko-KR')}
                    </div>
                  </div>
                </div>

                {report.content && (
                  <div style={{
                    padding: '16px',
                    background: '#f7fafc',
                    borderRadius: '8px',
                    marginTop: '16px'
                  }}>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#718096',
                      marginBottom: '8px',
                      fontWeight: '600'
                    }}>
                      내용
                    </div>
                    <div style={{ 
                      fontSize: '15px', 
                      color: '#2d3748',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {report.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

