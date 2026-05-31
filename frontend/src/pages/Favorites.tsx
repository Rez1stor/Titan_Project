import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';

export default function Favorites() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = () => {
    fetch('/api/Favorites', {
      headers: { 'X-User-Id': '1' }
    })
    .then(res => res.json())
    .then(data => {
      setFavorites(data);
      setLoading(false);
    })
    .catch(err => console.error(err));
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const removeFromFavorites = (id: any) => {
    fetch(`/api/Favorites/${id}`, {
      method: 'DELETE',
      headers: { 'X-User-Id': '1' }
    })
    .then(() => {
      setFavorites((current: any[]) => current.filter((f: any) => f.id !== id));
    });
  };

  const toggleFavorite = (id: any) => {
    removeFromFavorites(id);
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: '#5D4037' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      
      { }
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ color: '#2D2424', fontSize: '3rem', fontWeight: '900', marginBottom: '5px' }}>
          My Favorites
        </h1>
        <p style={{ color: '#9CA3AF', fontSize: '1rem', fontWeight: '500' }}>
          You have {favorites.length} saved products
        </p>
      </div>

      {favorites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
          <p style={{ fontSize: '1.2rem', color: '#6B7280', marginBottom: '20px' }}>Your list is still empty.</p>
          <a href="/catalog" style={{ 
            display: 'inline-block', backgroundColor: '#5D4037', color: 'white', 
            padding: '12px 30px', borderRadius: '15px', textDecoration: 'none', fontWeight: 'bold' 
          }}>
            Discover products
          </a>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '35px',
          justifyContent: 'center'
        }}>
          {favorites.map((beer: any) => (
            <ProductCard
              key={beer.id}
              product={beer}
              isFavorited
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}