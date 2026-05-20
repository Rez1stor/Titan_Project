import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export default function Catalog() {
  const [beers, setBeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie');
  const [favIds, setFavIds] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:5542/api/products').then((res) => res.json()),
      fetch('http://localhost:5542/api/Favorites', { headers: { 'X-User-Id': '1' } }).then((res) => res.json())
    ])
      .then(([productsData, favoritesData]) => {
        setBeers(productsData);
        setFavIds(favoritesData.map((f: any) => f.id));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const toggleFavorite = (productId: string) => {
    const isFav = favIds.includes(productId);
    if (isFav) {
      fetch(`http://localhost:5542/api/Favorites/${productId}`, {
        method: 'DELETE',
        headers: { 'X-User-Id': '1' },
      }).then(() => setFavIds(favIds.filter(id => id !== productId)));
    } else {
      fetch(`http://localhost:5542/api/Favorites/${productId}`, {
        method: 'POST',
        headers: { 'X-User-Id': '1', 'Content-Type': 'application/json' },
      }).then(() => setFavIds([...favIds, productId]));
    }
  };

  const filteredProducts = selectedCategory === 'Wszystkie'
    ? beers
    : beers.filter((item: any) => {
        const cat = (item.categoryName || "").toLowerCase();
        if (selectedCategory === 'Piwo') return cat === 'beer' || cat === 'piwo';
        if (selectedCategory === 'Wino') return cat === 'wine' || cat === 'wino';
        return false;
      });

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: '#5D4037' }}>Ładowanie...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ color: '#2D2424', fontSize: '3rem', fontWeight: '900', marginBottom: '10px' }}>Katalog</h1>
        <p style={{ color: '#6B7280', fontSize: '1.1rem' }}>Wybierz swój ulubiony trunek</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '50px' }}>
        {['Wszystkie', 'Piwo', 'Wino'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '12px 35px',
              borderRadius: '30px',
              border: '1px solid #5D4037',
              background: selectedCategory === cat ? '#5D4037' : 'white',
              color: selectedCategory === cat ? 'white' : '#5D4037',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: '0.3s'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '35px' }}>
        {filteredProducts.map((item: any) => {
          const isFavorited = favIds.includes(item.id);
          return (
            <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '28px', padding: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '220px', backgroundColor: '#FAF9F6', borderRadius: '22px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#5D4037', fontWeight: 'bold', opacity: 0.2, fontSize: '1.2rem', textTransform: 'uppercase' }}>
                  {item.categoryName === 'Beer' ? 'Piwo' : 'Wino'}
                </span>
              </div>

              <h2 style={{ fontSize: '1.6rem', color: '#2D2424', marginBottom: '10px', fontWeight: '800' }}>{item.name}</h2>
              <p style={{ color: '#6B7280', fontSize: '1rem', lineHeight: '1.5', marginBottom: '25px', flexGrow: 1 }}>{item.description}</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid #F9FAFB' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: '#9CA3AF' }}>CENA</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#5D4037' }}>{item.basePrice} PLN</span>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <button onClick={() => toggleFavorite(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>
                    <Heart size={28} fill={isFavorited ? "#EF4444" : "none"} color={isFavorited ? "#EF4444" : "#9CA3AF"} style={{ transition: '0.3s' }} />
                  </button>
                  <Link to={`/product/${item.id}`} style={{ backgroundColor: '#FAF9F6', color: '#5D4037', padding: '12px 25px', borderRadius: '14px', textDecoration: 'none', fontWeight: 'bold', border: '1px solid #5D4037' }}>
                    Szczegóły
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}