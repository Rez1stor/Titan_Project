import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav style={{ 
      padding: '1.2rem 2.5rem', 
      background: '#FFFFFF', 
      borderBottom: '1px solid #E5E7EB',
      display: 'flex', 
      alignItems: 'center',
      justifyContent: 'space-between' 
    }}>
      
      {  }
      <Link to="/" style={{ 
        fontSize: '1.6rem', 
        fontWeight: '900', 
        color: '#5D4037', 
        textDecoration: 'none', 
        letterSpacing: '-1.5px' 
      }}>
        BEER<span style={{ color: '#A0522D' }}>TRACKER</span>
      </Link>
      
      {  }
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '35px'
      }}>
        <Link to="/catalog" style={{ color: '#5D4037', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' }}>
          Katalog
        </Link>
        <Link to="/favorites" style={{ color: '#5D4037', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' }}>
          Ulubione
        </Link>
        <Link to="/recommendations" style={{ color: '#5D4037', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' }}>
          Dla Ciebie
        </Link>

        {  }
        <Link to="/login" style={{ 
          marginLeft: '10px',
          background: '#5D4037', 
          color: 'white', 
          padding: '11px 26px', 
          borderRadius: '14px', 
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          boxShadow: '0 4px 12px rgba(93, 64, 55, 0.15)'
        }}>
          Zaloguj
        </Link>
      </div>

    </nav>
  );
}