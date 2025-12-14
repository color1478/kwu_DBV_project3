'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { auth } from '@/lib/auth';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.getCurrentUser().then((user) => {
      if (!user || user.role !== 'ADMIN') {
        router.push('/');
        return;
      }
      fetchUsers();
    });
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/users');
      setUsers(response.data.users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: number, role: string) => {
    try {
      await api.put(`/api/admin/users/${userId}/role`, { role });
      fetchUsers();
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const toggleActive = async (userId: number, isActive: boolean) => {
    try {
      await api.put(`/api/admin/users/${userId}/active`, { isActive });
      fetchUsers();
    } catch (err) {
      console.error('Failed to update status:', err);
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
        <h1 className="page-title">회원 관리</h1>
        <div className="main-content">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>이메일</th>
                  <th>닉네임</th>
                  <th>역할</th>
                  <th>상태</th>
                  <th>대여 수</th>
                  <th>신고 수</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td>{user.user_id}</td>
                    <td>{user.email}</td>
                    <td>{user.nickname || '-'}</td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => updateRole(user.user_id, e.target.value)}
                        style={{
                          padding: '6px 12px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: user.is_active ? '#c6f6d5' : '#fed7d7',
                        color: user.is_active ? '#22543d' : '#742a2a',
                      }}>
                        {user.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td>{user.rental_count}</td>
                    <td>{user.report_count}</td>
                    <td>
                      <button
                        className={`btn btn-sm ${user.is_active ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => toggleActive(user.user_id, !user.is_active)}
                      >
                        {user.is_active ? '비활성화' : '활성화'}
                      </button>
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

