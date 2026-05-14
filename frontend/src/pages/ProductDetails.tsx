import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, ChevronLeft, Star, Globe, Droplets, Info, MessageSquare, Send } from 'lucide-react';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [beer, setBeer] = useState<any>(null);
  const [similar, setSimilar] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isFav, setIsFav] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const loadData = () => {
    fetch(`http://localhost:5542/api/products/${id}`).then(res => res.json()).then(data => setBeer(data));
    fetch(`http://localhost:5542/api/Recommendations/${id}`).then(res => res.json()).then(data => setSimilar(data));
    fetch(`http://localhost:5542/api/Reviews/product/${id}`).then(res => res.json()).then(data => setReviews(data));
    fetch('http://localhost:5542/api/Favorites', { headers: { 'X-User-Id': '1' } })
      .then(res => res.json())
      .then(favs => setIsFav(favs.some((f: any) => f.id === id)));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const toggleFavorite = () => {
    const method = isFav ? 'DELETE' : 'POST';
    fetch(`http://localhost:5542/api/Favorites/${id}`, {
      method: method,
      headers: { 'X-User-Id': '1' }
    }).then(() => setIsFav(!isFav));
  };

  const submitReview = (e: any) => {
    e.preventDefault();
    fetch('http://localhost:5542/api/Reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id, rating: rating.toString(), comment: comment })
    }).then(() => {
      setComment('');
      loadData();
    });
  };

  if (!beer) return <div style={{ padding: '100px', textAlign: 'center', color: '#5D4037' }}>Ładowanie...</div>;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#5D4037', cursor: 'pointer', marginBottom: '30px', fontWeight: 'bold' }}
      >
        <ChevronLeft size={20} /> Powrót
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'start', marginBottom: '80px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '40px', height: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #F3F4F6' }}>
          <span style={{ fontSize: '8rem', opacity: 0.1 }}>🍷</span>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ color: '#A0522D', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '2px' }}>
                {beer.categoryName}
              </span>
              <h1 style={{ fontSize: '3.5rem', color: '#2D2424', fontWeight: '900', margin: '10px 0', lineHeight: '1.1' }}>
                {beer.name}
              </h1>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#FFFBEB', padding: '6px 12px', borderRadius: '10px', border: '1px solid #FEF3C7' }}>
                  <Star size={18} fill="#F59E0B" color="#F59E0B" />
                  <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#92400E' }}>
                    {beer.avgRating && beer.avgRating !== "0" ? beer.avgRating : "0.0"}
                  </span>
                </div>
                <span style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>
                  ({beer.reviewsCount || 0} opinii koneserów)
                </span>
              </div>
            </div>
            <button onClick={toggleFavorite} style={{ background: 'white', border: '1px solid #E5E7EB', padding: '15px', borderRadius: '20px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
              <Heart size={30} fill={isFav ? "#EF4444" : "none"} color={isFav ? "#EF4444" : "#9CA3AF"} />
            </button>
          </div>

          <p style={{ fontSize: '1.15rem', color: '#6B7280', lineHeight: '1.7', margin: '30px 0' }}>{beer.description}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: '15px' }}>
               <Droplets color="#5D4037" />
               <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#9CA3AF' }}>MOC</span>
                  <span style={{ fontWeight: 'bold', color: '#2D2424' }}>{beer.strengthAbv}%</span>
               </div>
            </div>
            <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: '15px' }}>
               <Info color="#5D4037" />
               <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#9CA3AF' }}>CENA</span>
                  <span style={{ fontWeight: 'bold', color: '#2D2424' }}>{beer.basePrice} PLN</span>
               </div>
            </div>
          </div>

          <div style={{ background: '#FAF9F6', padding: '30px', borderRadius: '30px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: '800' }}>Dodaj swoją opinię</h3>
            <form onSubmit={submitReview}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                {[1, 2, 3, 4, 5].map(num => (
                  <Star 
                    key={num} 
                    size={24} 
                    cursor="pointer" 
                    fill={num <= rating ? "#F59E0B" : "none"} 
                    color={num <= rating ? "#F59E0B" : "#D1D5DB"}
                    onClick={() => setRating(num)}
                  />
                ))}
              </div>
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Twoje wrażenia z degustacji..."
                style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #E5E7EB', minHeight: '100px', marginBottom: '15px', fontFamily: 'inherit' }}
              />
              <button type="submit" style={{ width: '100%', background: '#2D2424', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <Send size={18} /> Wyślij opinię
              </button>
            </form>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '80px' }}>
        <h3 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <MessageSquare size={30} /> Recenzje ({reviews.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {reviews.length === 0 ? <p style={{ color: '#9CA3AF' }}>Brak opinii. Bądź pierwszy!</p> : reviews.map((rev: any) => (
            <div key={rev.id} style={{ background: 'white', padding: '25px', borderRadius: '25px', border: '1px solid #F3F4F6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>{rev.username || 'Anonimowy koneser'}</span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < parseInt(rev.rating) ? "#F59E0B" : "none"} color={i < parseInt(rev.rating) ? "#F59E0B" : "#D1D5DB"} />
                  ))}
                </div>
              </div>
              <p style={{ margin: 0, color: '#6B7280', lineHeight: '1.6' }}>{rev.comment}</p>
              <small style={{ color: '#D1D5DB', marginTop: '10px', display: 'block' }}>{new Date(rev.createdAt).toLocaleDateString()}</small>
            </div>
          ))}
        </div>
      </div>

      {similar.length > 0 && (
        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '60px' }}>
          <h3 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '30px', color: '#2D2424' }}>Podobne produkty</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '25px' }}>
            {similar.map((item: any) => (
              <Link to={`/product/${item.id}`} key={item.id} style={{ textDecoration: 'none', background: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #F3F4F6' }}>
                <div style={{ height: '120px', background: '#FAF9F6', borderRadius: '15px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🍷</div>
                <h4 style={{ color: '#2D2424', margin: '0' }}>{item.name}</h4>
                <span style={{ color: '#5D4037', fontWeight: 'bold' }}>{item.basePrice} PLN</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}