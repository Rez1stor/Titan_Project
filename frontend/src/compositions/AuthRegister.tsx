import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import Input from '../components/Input';
import Button from '../components/Button';
import SelectField from '../components/alcohol/SelectField';
import FormCard from '../components/FormCard';
import Notification from '../components/Notification';
import PreferenceModal from '../components/PreferenceModal';
import { countries } from '../utils/countries';
import { STORAGE_KEY, describeProfile, type AlcoholProfile } from '../utils/alcoholProfiles';
import { apiRoutes, notifyAuthChanged } from '../api/routes';
import { ApiError, apiFetch } from '../utils/api';

export default function AuthRegister() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [savedProfile, setSavedProfile] = useState<AlcoholProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
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

  const handleRegister = async (profileToSave?: AlcoholProfile) => {
    setError(null);
    setLoading(true);
    try {
      let preferences = undefined;
      if (profileToSave) {
        const tags = [
          ...profileToSave.categories,
          ...profileToSave.primaryChoices,
          ...profileToSave.secondaryChoices
        ].filter(t => t !== 'All' && t.trim() !== '');

        let maxPrice: number | null = null;
        if (profileToSave.priceBands.includes('Budget')) maxPrice = 25;
        if (profileToSave.priceBands.includes('Classic')) maxPrice = 40;
        if (profileToSave.priceBands.includes('Premium')) maxPrice = 70;
        if (profileToSave.priceBands.includes('Luxury')) maxPrice = 1000;
        if (profileToSave.priceBands.includes('Any')) maxPrice = null;

        preferences = {
          TargetAbv: profileToSave.strength,
          AbvTolerance: 3.5,
          MaxPrice: maxPrice,
          PreferredTags: tags
        };
      }

      await apiFetch(apiRoutes.auth.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          Username: username, 
          Email: email, 
          Password: password, 
          Country: country || null,
          Preferences: preferences
        }),
      });

      if (profileToSave) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profileToSave));
      }

      notifyAuthChanged();
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err instanceof ApiError ? err.message : 'Network error during registration');
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (!savedProfile) {
      setShowModal(true);
      return;
    }

    await handleRegister(savedProfile);
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

      {showModal && (
        <PreferenceModal
          onSave={(profile) => {
            setShowModal(false);
            handleRegister(profile);
          }}
          onSkip={() => {
            setShowModal(false);
            handleRegister();
          }}
        />
      )}
    </div>
  );
}
