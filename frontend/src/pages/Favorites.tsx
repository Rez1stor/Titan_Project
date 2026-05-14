import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = () => {
    fetch('http://localhost:5542/api/Favorites', {
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
    fetch(`http://localhost:5542/api/Favorites/${id}`, {
      method: 'DELETE',
      headers: { 'X-User-Id': '1' }
    })
    .then(() => {
      setFavorites(favorites.filter((f: any) => f.id !== id));
    });
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: '#5D4037' }}>Ładowanie...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      
      { }
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ color: '#2D2424', fontSize: '3rem', fontWeight: '900', marginBottom: '5px' }}>
          Moje Ulubione
        </h1>
        <p style={{ color: '#9CA3AF', fontSize: '1rem', fontWeight: '500' }}>
          Masz {favorites.length} zapisanych produktów
        </p>
      </div>

      {favorites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
          <p style={{ fontSize: '1.2rem', color: '#6B7280', marginBottom: '20px' }}>Twoja lista jest jeszcze pusta.</p>
          <Link to="/catalog" style={{ 
            display: 'inline-block', backgroundColor: '#5D4037', color: 'white', 
            padding: '12px 30px', borderRadius: '15px', textDecoration: 'none', fontWeight: 'bold' 
          }}>
            Odkryj produkty
          </Link>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '35px',
          justifyContent: 'center'
        }}>
          {favorites.map((beer: any) => (
            <div key={beer.id} style={{ 
              backgroundColor: 'white', borderRadius: '28px', padding: '25px', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #F3F4F6',
              display: 'flex', flexDirection: 'column'
            }}>
              
              { }
              <div style={{
                height: '180px',
                backgroundColor: '#FAF9F6',
                borderRadius: '20px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: '#5D4037', fontWeight: 'bold', opacity: 0.2 }}>PIWO</span>
              </div>

              <h2 style={{ fontSize: '1.5rem', color: '#2D2424', marginBottom: '8px', fontWeight: '800' }}>
                {beer.name}
              </h2>
              <p style={{ color: '#9CA3AF', fontSize: '0.9rem', marginBottom: '20px', textTransform: 'uppercase' }}>
                {beer.categoryName || 'Beer'}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #F9FAFB' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#5D4037' }}>
                  {beer.basePrice} PLN
                </span>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link to={`/product/${beer.id}`} style={{ 
                      backgroundColor: '#FAF9F6', color: '#5D4037', padding: '10px 15px', 
                      borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', border: '1px solid #5D4037', fontSize: '0.85rem'
                    }}>
                      Szczegóły
                    </Link>
                    <button 
                      onClick={() => removeFromFavorites(beer.id)}
                      style={{ 
                        background: '#FFF5F5', color: '#C53030', padding: '10px 15px', 
                        borderRadius: '12px', border: '1px solid #FC8181', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem'
                      }}
                    >
                      Usuń
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}