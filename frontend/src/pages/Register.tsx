import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import Input from '../components/Input';
import Button from '../components/Button';
import SelectField from '../components/alcohol/SelectField';
import FormCard from '../components/FormCard';
import Notification from '../components/Notification';
import { countries } from '../utils/countries';
import { STORAGE_KEY, describeProfile, type AlcoholProfile } from '../utils/alcoholProfiles';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [savedProfile, setSavedProfile] = useState<AlcoholProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const rawProfile = window.localStorage.getItem(STORAGE_KEY);

    if (!rawProfile) {
      return;
    }

    try {
      setSavedProfile(JSON.parse(rawProfile) as AlcoholProfile);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ Username: username, Email: email, Password: password, Country: country || null })
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(payload?.error || payload?.message || 'Registration failed');
        setLoading(false);
        return;
      }

      // on success server signs in via cookie
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Network error during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', padding: '20px' }}>
      <FormCard title="Create account" subtitle="Join Titan to save favorites and write reviews">

        {savedProfile ? (
          <div style={{ marginBottom: '12px' }}>
            <Notification type="success">
              Your alcohol profile is ready: {describeProfile(savedProfile)}
            </Notification>
          </div>
        ) : (
          <div style={{ marginBottom: '12px' }}>
            <Notification type="info">
              Build your alcohol profile on the homepage first, then create an account to keep it for later.
            </Notification>
          </div>
        )}

        {error ? (
          <div style={{ marginBottom: '12px' }}><Notification type="error">{error}</Notification></div>
        ) : null}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input icon={<User size={18} color="#9CA3AF" />} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
          <Input icon={<Mail size={18} color="#9CA3AF" />} value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" />
          <Input icon={<Lock size={18} color="#9CA3AF" />} value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password (min 8 chars)" />

          <SelectField
            options={countries.map((c) => ({ label: c, value: c }))}
            value={country}
            onChange={(c) => setCountry(c)}
            placeholder="Select country (optional)"
            variant="field"
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Button disabled={loading} type="submit" style={{ flex: 1 }}>{loading ? 'Signing up…' : 'Create account'}</Button>
            <Link to="/login" style={{ alignSelf: 'center', color: '#5D4037', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
          </div>
        </form>
      </FormCard>
    </div>
  );
}
