import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

type AuthUserDto = {
  userId: number;
  username: string;
  email: string;
  country?: string | null;
  role?: string | null;
};

const avatarOptions = ['🍺', '🍷', '🥂', '🍾', '🍸', '🫗', '🌿', '⭐'];

function pickAvatar(username: string) {
  const normalized = username.trim().toLowerCase();
  let hash = 0;

  for (const character of normalized) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return avatarOptions[hash % avatarOptions.length];
}

export default function Navbar() {
  const [user, setUser] = useState<AuthUserDto | null>(null);

  useEffect(() => {
    let active = true;

    const fetchMe = () => {
      fetch('/api/auth/me', { credentials: 'include' })
        .then(async (response) => {
          if (!active || !response.ok) return null;
          return response.json();
        })
        .then((user) => {
          if (!active || !user) return;
          setUser(user as AuthUserDto);
        })
        .catch(() => {
          if (active) setUser(null);
        });
    };

    fetchMe();

    const onAuthChanged = () => {
      // re-fetch current user when auth state changes (login/logout)
      fetchMe();
    };

    window.addEventListener('auth-changed', onAuthChanged);

    return () => {
      active = false;
      window.removeEventListener('auth-changed', onAuthChanged);
    };
  }, []);

  const avatar = useMemo(() => pickAvatar(user?.username ?? 'guest'), [user?.username]);

  const navigate = useNavigate();

  const handleAddProduct = () => {
    if (!(user?.role === 'Admin' || user?.role === 'Moderator')) {
      alert('Only administrators can add products.');
      return;
    }

    navigate('/product/create');
  };

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
      <span style={{ color: '#A0522D' }}>TITAN</span>
      </Link>
      
      {  }
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '35px'
      }}>
        <Link to="/catalog" style={{ color: '#5D4037', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' }}>
          Catalog
        </Link>
        <Link to="/favorites" style={{ color: '#5D4037', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' }}>
          Favorites
        </Link>
        <Link to="/recommendations" style={{ color: '#5D4037', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' }}>
          For You
        </Link>

        {user && (user.role === 'Admin' || user.role === 'Moderator') ? (
          <button
            type="button"
            onClick={handleAddProduct}
            style={{
              background: '#2D2424',
              color: '#FFF7ED',
              padding: '11px 18px',
              borderRadius: '14px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.9rem',
            }}
          >
            Add Product
          </button>
        ) : null}

        {user ? (
          <Link to="/profile" style={{
            marginLeft: '10px',
            background: '#5D4037',
            color: 'white',
            padding: '8px 14px 8px 10px',
            borderRadius: '999px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            boxShadow: '0 4px 12px rgba(93, 64, 55, 0.15)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{
              width: '30px',
              height: '30px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.16)',
              display: 'grid',
              placeItems: 'center',
              fontSize: '1rem'
            }} aria-hidden="true">
              {avatar}
            </span>
            My Profile
          </Link>
        ) : (
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
            Sign In
          </Link>
        )}
      </div>

    </nav>
  );
}