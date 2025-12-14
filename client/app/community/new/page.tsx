'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { auth } from '@/lib/auth';

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/api/community', { title, body });
      // 글 작성 성공 후 커뮤니티 페이지로 이동 (새로고침하여 최신 게시글 표시)
      router.push('/community');
      router.refresh(); // 페이지 새로고침
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create post');
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

      <main className="container" style={{ maxWidth: '800px' }}>
        <h1>글쓰기</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>내용</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '작성 중...' : '작성'}
          </button>
        </form>
      </main>
    </div>
  );
}

