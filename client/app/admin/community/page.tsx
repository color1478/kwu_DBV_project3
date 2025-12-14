'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { auth } from '@/lib/auth';

export default function AdminCommunityPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    auth.getCurrentUser().then((user) => {
      if (!user || user.role !== 'ADMIN') {
        router.push('/');
        return;
      }
      fetchPosts();
    });
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get(`/api/community?limit=100&search=${searchTerm}`);
      setPosts(response.data.posts || []);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm !== undefined) {
      fetchPosts();
    }
  }, [searchTerm]);

  const handleDelete = async (postId: number) => {
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
    
    try {
      await api.delete(`/api/community/${postId}`);
      fetchPosts();
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert('게시글 삭제에 실패했습니다.');
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
        <h1 className="page-title">커뮤니티 관리</h1>

        <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="게시글 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          />
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>제목</th>
                <th>작성자</th>
                <th>조회수</th>
                <th>댓글</th>
                <th>좋아요</th>
                <th>작성일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                    게시글이 없습니다.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.post_id}>
                    <td>{post.post_id}</td>
                    <td>
                      <Link 
                        href={`/community/${post.post_id}`}
                        style={{ color: '#4299e1', textDecoration: 'none' }}
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td>{post.author_name}</td>
                    <td>{post.views || 0}</td>
                    <td>{post.comment_count || 0}</td>
                    <td>{post.like_count || 0}</td>
                    <td>{new Date(post.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(post.post_id)}
                        style={{
                          padding: '6px 12px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          transition: 'background 0.2s',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#c82333'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#dc3545'}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

