'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { auth } from '@/lib/auth';

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    assigneeId: '',
    priority: '0',
    dueDate: '',
  });

  useEffect(() => {
    auth.getCurrentUser().then((user) => {
      if (!user || user.role !== 'ADMIN') {
        router.push('/');
        return;
      }
      fetchReports();
    });
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/api/admin/reports');
      setReports(response.data.reports);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const createMaintenanceOrder = async (reportId: number) => {
    try {
      await api.post(`/api/admin/reports/${reportId}/maintenance`, maintenanceForm);
      setSelectedReport(null);
      setMaintenanceForm({ assigneeId: '', priority: '0', dueDate: '' });
      fetchReports();
    } catch (err) {
      console.error('Failed to create maintenance order:', err);
    }
  };

  const validateReport = async (reportId: number, isValid: boolean) => {
    try {
      await api.put(`/api/admin/reports/${reportId}/validate`, { isValid });
      fetchReports();
    } catch (err) {
      console.error('Failed to validate report:', err);
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
        <h1 className="page-title">신고 및 정비 관리</h1>
        <p style={{ marginBottom: '20px', color: '#718096' }}>
          고장 신고를 검증하고, 유지보수 주문을 배정하여 정비를 관리합니다.
        </p>
        <div className="main-content">
          {reports.map((report) => (
          <div key={report.report_id} className="card">
            <h3>신고 #{report.report_id}</h3>
            <p>신고자: {report.reporter_name}</p>
            <p>대여소: {report.station_name}</p>
            <p>카테고리: {report.category}</p>
            <p>상태: {report.status}</p>
            <p>내용: {report.content}</p>
            <p>작성일: {new Date(report.created_at).toLocaleString()}</p>
            {report.maintenance_status && (
              <p>유지보수 상태: {report.maintenance_status}</p>
            )}
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
              {!report.order_id && (
                <button
                  className="btn btn-primary"
                  onClick={() => setSelectedReport(report)}
                >
                  유지보수 배정
                </button>
              )}
              {report.status === 'DONE' && report.is_valid === null && (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={() => validateReport(report.report_id, true)}
                  >
                    유효 검증
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => validateReport(report.report_id, false)}
                  >
                    무효 검증
                  </button>
                </>
              )}
            </div>
          </div>
          ))}
        </div>

        {selectedReport && (
          <div className="card" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, background: 'white', padding: '30px' }}>
            <h2>유지보수 배정</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              createMaintenanceOrder(selectedReport.report_id);
            }}>
              <div className="form-group">
                <label>담당자 ID</label>
                <input
                  type="number"
                  value={maintenanceForm.assigneeId}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, assigneeId: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>우선순위</label>
                <input
                  type="number"
                  value={maintenanceForm.priority}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, priority: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>마감일</label>
                <input
                  type="date"
                  value={maintenanceForm.dueDate}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, dueDate: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary">배정</button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedReport(null)}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

