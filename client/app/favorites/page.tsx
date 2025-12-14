'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { auth } from '@/lib/auth';

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    auth.getCurrentUser().then((u) => {
      if (!u) {
        router.push('/login');
        return;
      }
      setUser(u);
      fetchFavorites();
    });
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await api.get('/api/favorites');
      setFavorites(response.data.favorites);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (stationId: number) => {
    try {
      await api.delete(`/api/favorites/${stationId}`);
      fetchFavorites();
    } catch (err) {
      console.error('Failed to remove favorite:', err);
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
        <h1>즐겨찾기</h1>
        {favorites.length === 0 ? (
          <p>즐겨찾기한 대여소가 없습니다.</p>
        ) : (
          <div>
            {favorites.map((fav) => (
              <div key={fav.fav_id} className="card">
                <h3>
                  <Link href={`/station/${fav.station_id}`}>
                    {fav.station_name}
                  </Link>
                </h3>
                <p>지역: {fav.area_name}</p>
                <p>대여 가능: {fav.bikes_available || 0}대</p>
                <p>반납 가능: {fav.docks_available || 0}개</p>
                <button
                  className="btn btn-danger"
                  onClick={() => removeFavorite(fav.station_id)}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

