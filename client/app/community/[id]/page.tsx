'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { auth } from '@/lib/auth';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [commentBody, setCommentBody] = useState('');

  useEffect(() => {
    auth.getCurrentUser().then(setUser);
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await api.get(`/api/community/${postId}`);
      setData(response.data);
    } catch (err) {
      console.error('Failed to fetch post:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      await api.post(`/api/community/${postId}/like`);
      fetchPost();
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      await api.post(`/api/community/${postId}/comments`, { body: commentBody });
      setCommentBody('');
      fetchPost();
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/api/community/${postId}`);
      router.push('/community');
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  if (loading) return <div className="container">로딩 중...</div>;
  if (!data) return <div className="container">게시글을 찾을 수 없습니다.</div>;

  const { post, comments, likeCount, isLiked } = data;
  const isAuthor = user && user.userId === post.author_id;

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
        <Link href="/community">← 목록</Link>
        <div className="card">
          <h1>{post.title}</h1>
          <p>작성자: {post.author_name} | 조회수: {post.views}</p>
          <p>작성일: {new Date(post.created_at).toLocaleString()}</p>
          <div style={{ marginTop: '20px' }}>{post.body}</div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={handleLike}>
              {isLiked ? '❤️' : '🤍'} {likeCount}
            </button>
            {isAuthor && (
              <>
                <Link href={`/community/${postId}/edit`} className="btn btn-secondary">수정</Link>
                <button className="btn btn-danger" onClick={handleDelete}>삭제</button>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <h2>댓글 ({comments.length})</h2>
          {user ? (
            <form onSubmit={handleComment} style={{ marginBottom: '20px' }}>
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="댓글을 입력하세요"
                style={{ width: '100%', minHeight: '80px', marginBottom: '10px' }}
                required
              />
              <button type="submit" className="btn btn-primary">댓글 작성</button>
            </form>
          ) : (
            <p><Link href="/login">로그인</Link> 후 댓글을 작성할 수 있습니다.</p>
          )}
          {comments.map((comment: any) => (
            <div key={comment.comment_id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
              <p><strong>{comment.author_name}</strong> - {new Date(comment.created_at).toLocaleString()}</p>
              <p>{comment.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

