import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function Recommendations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5542/api/Recommendations/for-user', {
      headers: { 'X-User-Id': '1' }
    })
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: '#5D4037' }}>Ładowanie propozycji...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#F5F5DC', padding: '8px 20px', borderRadius: '30px', color: '#5D4037', fontWeight: 'bold', marginBottom: '15px' }}>
          <Sparkles size={18} /> Wybrane dla Ciebie
        </div>
        <h1 style={{ color: '#2D2424', fontSize: '3rem', fontWeight: '900' }}>Polecane produkty</h1>
        <p style={{ color: '#6B7280', fontSize: '1.1rem' }}>Na podstawie Twoich polubionych smaków</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '35px' }}>
        {items.map((item: any) => (
          <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '28px', padding: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #F3F4F6' }}>
            <div style={{ height: '200px', backgroundColor: '#FAF9F6', borderRadius: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#5D4037', fontWeight: 'bold', opacity: 0.2 }}>{item.categoryName}</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', color: '#2D2424', marginBottom: '10px', fontWeight: '800' }}>{item.name}</h2>
            <p style={{ color: '#6B7280', marginBottom: '20px' }}>{item.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#5D4037' }}>{item.basePrice} PLN</span>
              <Link to={`/product/${item.id}`} style={{ backgroundColor: '#5D4037', color: 'white', padding: '10px 20px', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold' }}>
                Sprawdź
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}