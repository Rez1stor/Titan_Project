import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useState } from 'react';
import Input from '../components/Input';
import Button from '../components/Button';
import FormCard from '../components/FormCard';
import Notification from '../components/Notification';
import { apiRoutes, notifyAuthChanged } from '../api/routes';
import { ApiError, apiFetch } from '../utils/api';

export default function AuthLogin() {
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
      await apiFetch(apiRoutes.auth.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Username: username, Password: password }),
      });

      notifyAuthChanged();
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err instanceof ApiError ? err.message : 'Network error during sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh] p-5">
      <FormCard title="Welcome back" subtitle="Sign in to manage your collection">

        {error && (
          <div className="mb-3"><Notification type="error">{error}</Notification></div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input icon={<Mail size={20} className="text-gray-400" />} value={username} onChange={(e) => setUsername(e.target.value)} type="text" placeholder="Username" />
          <Input icon={<Lock size={20} className="text-gray-400" />} value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />

          <Button type="submit" disabled={loading} className="mt-1.5 flex items-center justify-center gap-2.5">
            <LogIn size={18} /> {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center mt-4.5">
          <p className="text-gray-400 text-sm">
            Don't have an account? {' '}
            <Link to="/register" className="text-brand-color font-bold no-underline hover:text-text-main transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </FormCard>
    </div>
  );
}
