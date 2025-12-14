'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [search]);

  // 페이지 포커스 시 게시글 새로고침
  useEffect(() => {
    const handleFocus = () => {
      fetchPosts();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/api/community', {
        params: { search },
      });
      setPosts(response.data.posts);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>커뮤니티</h1>
          <Link href="/community/new" className="btn btn-primary">글쓰기</Link>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '300px', padding: '8px' }}
          />
        </div>

        {posts.length === 0 ? (
          <p>게시글이 없습니다.</p>
        ) : (
          <div>
            {posts.map((post) => (
              <div key={post.post_id} className="card">
                <h3>
                  <Link href={`/community/${post.post_id}`}>{post.title}</Link>
                </h3>
                <p>작성자: {post.author_name}</p>
                <p>조회수: {post.views} | 댓글: {post.comment_count} | 좋아요: {post.like_count}</p>
                <p>작성일: {new Date(post.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

