import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useState } from 'react';
import Input from '../components/Input';
import Button from '../components/Button';
import FormCard from '../components/FormCard';
import Notification from '../components/Notification';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ Username: username, Password: password })
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(payload?.error || payload?.message || 'Invalid credentials');
        setLoading(false);
        return;
      }

      // notify app that auth state changed so Navbar and other components refresh
      try { window.dispatchEvent(new Event('auth-changed')); } catch {}
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Network error during sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '70vh',
      padding: '20px'
    }}>
      <FormCard title="Welcome back" subtitle="Sign in to manage your collection">

        {error ? (
          <div style={{ marginBottom: '12px' }}><Notification type="error">{error}</Notification></div>
        ) : null}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input icon={<Mail size={20} color="#9CA3AF" />} value={username} onChange={(e) => setUsername(e.target.value)} type="text" placeholder="Username" />
          <Input icon={<Lock size={20} color="#9CA3AF" />} value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />

          <Button type="submit" disabled={loading} style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <LogIn size={18} /> {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '18px' }}>
          <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>
            Don't have an account? {' '}
            <Link to="/register" style={{ color: '#5D4037', fontWeight: 'bold', textDecoration: 'none' }}>
              Sign up
            </Link>
          </p>
        </div>
      </FormCard>
    </div>
  );
}