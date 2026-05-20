import { Link } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';

export default function Login() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '70vh',
      padding: '20px'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        width: '100%', 
        maxWidth: '450px', 
        padding: '50px', 
        borderRadius: '35px', 
        boxShadow: '0 20px 50px rgba(93, 64, 55, 0.05)',
        border: '1px solid #F3F4F6'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: '#2D2424', fontSize: '2.5rem', fontWeight: '900', marginBottom: '10px' }}>
            Witaj ponownie
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '1rem' }}>
            Zaloguj się, aby zarządzać swoją kolekcją
          </p>
        </div>

        <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={20} color="#9CA3AF" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="email" 
              placeholder="Twój adres email" 
              style={{ 
                width: '100%', 
                padding: '15px 15px 15px 45px', 
                borderRadius: '15px', 
                border: '1px solid #E5E7EB', 
                backgroundColor: '#FAF9F6',
                fontSize: '1rem',
                outline: 'none',
                fontFamily: 'inherit'
              }} 
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={20} color="#9CA3AF" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="password" 
              placeholder="Hasło" 
              style={{ 
                width: '100%', 
                padding: '15px 15px 15px 45px', 
                borderRadius: '15px', 
                border: '1px solid #E5E7EB', 
                backgroundColor: '#FAF9F6',
                fontSize: '1rem',
                outline: 'none',
                fontFamily: 'inherit'
              }} 
            />
          </div>

          <button 
            type="submit" 
            style={{ 
              marginTop: '10px',
              backgroundColor: '#5D4037', 
              color: 'white', 
              padding: '16px', 
              borderRadius: '15px', 
              border: 'none', 
              fontSize: '1.1rem', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 10px 20px rgba(93, 64, 55, 0.2)'
            }}
          >
            <LogIn size={20} /> Zaloguj się
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>
            Nie masz konta? {' '}
            <Link to="/register" style={{ color: '#5D4037', fontWeight: 'bold', textDecoration: 'none' }}>
              Zarejestruj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}