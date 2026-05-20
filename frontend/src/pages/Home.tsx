import { Link } from 'react-router-dom';
import { Beer, Heart, Sparkles, Star } from 'lucide-react';

export default function Home() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      
      {/* HERO СЕКЦІЯ */}
      <div style={{ 
        textAlign: 'center', 
        padding: '100px 20px', 
        backgroundColor: 'white', 
        borderRadius: '50px', 
        boxShadow: '0 20px 60px rgba(93, 64, 55, 0.05)',
        marginBottom: '60px',
        border: '1px solid #F3F4F6'
      }}>
        <h1 style={{ 
          fontSize: '4.5rem', 
          color: '#2D2424', 
          fontWeight: '900', 
          lineHeight: '1.1',
          marginBottom: '25px'
        }}>
          Twoja osobista <br /> 
          <span style={{ color: '#5D4037' }}>piwniczka</span>
        </h1>
        <p style={{ 
          fontSize: '1.3rem', 
          color: '#6B7280', 
          maxWidth: '600px', 
          margin: '0 auto 40px auto',
          lineHeight: '1.6'
        }}>
          Śledź swoje degustacje, oceniaj unikalne smaki i otrzymuj rekomendacje dopasowane do Twojego podniebienia.
        </p>
        <Link to="/catalog" style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#5D4037', 
          color: 'white', 
          padding: '18px 45px', 
          borderRadius: '20px', 
          fontSize: '1.2rem', 
          fontWeight: 'bold', 
          textDecoration: 'none',
          boxShadow: '0 10px 25px rgba(93, 64, 55, 0.2)',
          transition: '0.3s'
        }}>
          Przejdź do katalogu <Beer size={24} />
        </Link>
      </div>

      {/* ПЕРЕВАГИ (FEATURES) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '30px' 
      }}>
        
        <div style={featureCardStyle}>
          <div style={iconBoxStyle}><Star color="#5D4037" size={30} /></div>
          <h3 style={featureTitleStyle}>Oceń smak</h3>
          <p style={featureTextStyle}>Dodawaj recenzje i oceniaj piwa oraz wina, aby zapamiętać każdy detal degustacji.</p>
        </div>

        <div style={featureCardStyle}>
          <div style={iconBoxStyle}><Heart color="#5D4037" size={30} /></div>
          <h3 style={featureTitleStyle}>Twoja kolekcja</h3>
          <p style={featureTextStyle}>Zapisuj ulubione produkty na swojej osobistej liście, aby mieć do nich szybki dostęp.</p>
        </div>

        <div style={featureCardStyle}>
          <div style={iconBoxStyle}><Sparkles color="#5D4037" size={30} /></div>
          <h3 style={featureTitleStyle}>Rekomendacje</h3>
          <p style={featureTextStyle}>Nasz system podpowie Ci, co warto spróbować dalej na podstawie Twoich polubień.</p>
        </div>

      </div>

      {/* ФУТЕР-ПЛАШКА */}
      <div style={{ 
        marginTop: '80px', 
        textAlign: 'center', 
        padding: '40px', 
        backgroundColor: '#F5F5DC', 
        borderRadius: '35px' 
      }}>
        <h2 style={{ color: '#5D4037', fontSize: '1.8rem', fontWeight: '800' }}>Gotowy na nową przygodę?</h2>
        <p style={{ color: '#8D6E63', marginBottom: '25px' }}>Dołącz do społeczności koneserów już dziś.</p>
        <Link to="/login" style={{ color: '#5D4037', fontWeight: 'bold', textDecoration: 'underline' }}>
          Zaloguj się lub utwórz konto
        </Link>
      </div>

    </div>
  );
}

// Стилі для карток переваг
const featureCardStyle = {
  backgroundColor: 'white',
  padding: '40px',
  borderRadius: '35px',
  border: '1px solid #F3F4F6',
  boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
  textAlign: 'center' as const
};

const iconBoxStyle = {
  backgroundColor: '#FAF9F6',
  width: '70px',
  height: '70px',
  borderRadius: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 25px auto'
};

const featureTitleStyle = {
  fontSize: '1.5rem',
  color: '#2D2424',
  fontWeight: '800',
  marginBottom: '15px'
};

const featureTextStyle = {
  color: '#6B7280',
  lineHeight: '1.6',
  fontSize: '1rem'
};