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
import { apiRoutes } from '../api/routes';
import { ApiError, apiFetch } from '../utils/api';

export default function AuthRegister() {
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
      await apiFetch(apiRoutes.auth.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Username: username, Email: email, Password: password, Country: country || null }),
      });

      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err instanceof ApiError ? err.message : 'Network error during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh] p-5">
      <FormCard title="Create account" subtitle="Join Titan to save favorites and write reviews">

        {savedProfile ? (
          <div className="mb-3">
            <Notification type="success">
              Your alcohol profile is ready: {describeProfile(savedProfile)}
            </Notification>
          </div>
        ) : (
          <div className="mb-3">
            <Notification type="info">
              Build your alcohol profile on the homepage first, then create an account to keep it for later.
            </Notification>
          </div>
        )}

        {error && (
          <div className="mb-3"><Notification type="error">{error}</Notification></div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-3">
          <Input icon={<User size={18} className="text-gray-400" />} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
          <Input icon={<Mail size={18} className="text-gray-400" />} value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" />
          <Input icon={<Lock size={18} className="text-gray-400" />} value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password (min 8 chars)" />

          <SelectField
            options={countries.map((c) => ({ label: c, value: c }))}
            value={country}
            onChange={(c) => setCountry(c)}
            placeholder="Select country (optional)"
            variant="field"
          />

          <div className="flex gap-3 mt-2">
            <Button disabled={loading} type="submit" className="flex-1">{loading ? 'Signing up…' : 'Create account'}</Button>
            <Link to="/login" className="self-center text-brand-color font-bold no-underline hover:text-text-main transition-colors">Sign in</Link>
          </div>
        </form>
      </FormCard>
    </div>
  );
}
