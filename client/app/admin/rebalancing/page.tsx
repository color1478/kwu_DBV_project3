'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { auth } from '@/lib/auth';

export default function AdminRebalancingPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.getCurrentUser().then((user) => {
      if (!user || user.role !== 'ADMIN') {
        router.push('/');
        return;
      }
      fetchData();
    });
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/api/admin/rebalancing');
      setData(response.data);
    } catch (err) {
      console.error('Failed to fetch rebalancing data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container">로딩 중...</div>;
  if (!data) return null;

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
        <h1 className="page-title">재배치 관리</h1>
        <p style={{ marginBottom: '20px', color: '#718096' }}>
          자전거가 부족한 대여소와 여유 있는 대여소를 자동 분석해 재배치 경로를 제안합니다.
        </p>

        <div className="main-content">
          <h2>자전거가 부족한 대여소 ({data.needsBikes.length}개)</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>대여소</th>
                  <th>대여 가능</th>
                  <th>반납 가능</th>
                  <th>총 도크</th>
                </tr>
              </thead>
              <tbody>
                {data.needsBikes.map((station: any) => (
                  <tr key={station.station_id}>
                    <td style={{ fontWeight: '600' }}>{station.station_name}</td>
                    <td style={{ color: '#dc3545', fontWeight: '600' }}>{station.bikes_available || 0}대</td>
                    <td>{station.docks_available || 0}개</td>
                    <td>{station.docks_total || 0}개</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="main-content" style={{ marginTop: '24px' }}>
          <h2>자전거가 여유로운 대여소 ({data.hasExcess.length}개)</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>대여소</th>
                  <th>대여 가능</th>
                  <th>반납 가능</th>
                  <th>이용률</th>
                </tr>
              </thead>
              <tbody>
                {data.hasExcess.map((station: any) => (
                  <tr key={station.station_id}>
                    <td style={{ fontWeight: '600' }}>{station.station_name}</td>
                    <td style={{ color: '#28a745', fontWeight: '600' }}>{station.bikes_available || 0}대</td>
                    <td>{station.docks_available || 0}개</td>
                    <td>{((station.utilization_ratio || 0) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="main-content" style={{ marginTop: '24px' }}>
          <h2>재배치 제안 ({data.suggestions.length}개)</h2>
          {data.suggestions.length === 0 ? (
            <p>재배치 제안이 없습니다.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>출발 대여소</th>
                    <th>도착 대여소</th>
                    <th>제안 수량</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {data.suggestions.map((suggestion: any, index: number) => (
                    <tr key={index}>
                      <td style={{ fontWeight: '600' }}>{suggestion.from_station_name}</td>
                      <td style={{ fontWeight: '600' }}>{suggestion.to_station_name}</td>
                      <td style={{ color: '#007bff', fontWeight: '700', fontSize: '16px' }}>
                        {suggestion.suggested_bikes}대
                      </td>
                      <td>
                        <button className="btn btn-sm btn-primary">재배치 실행</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

