import { useState } from 'react';
import { X, User, Mail, Lock, Trash2 } from 'lucide-react';
import Input from './Input';
import Button from './Button';
import Notification from './Notification';
import type { PublicUserProfileDto } from '../types';
import { apiRoutes, notifyAuthChanged } from '../api/routes';
import { ApiError, apiFetch, userHeaders } from '../utils/api';
import { useNavigate } from 'react-router-dom';

interface UserSettingsModalProps {
  user: PublicUserProfileDto;
  onClose: () => void;
  onSuccess: (updatedUser: PublicUserProfileDto) => void;
}

export default function UserSettingsModal({ user, onClose, onSuccess }: UserSettingsModalProps) {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email) {
      setError('Username and email are required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const headers = await userHeaders({ 'Content-Type': 'application/json' });
      const response = await apiFetch<PublicUserProfileDto>(apiRoutes.users.byId(user.userId), {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          Username: username,
          Email: email,
          Password: password || undefined,
        }),
      });

      onSuccess(response);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const headers = await userHeaders();
      await apiFetch(apiRoutes.users.byId(user.userId), {
        method: 'DELETE',
        headers,
        parseJson: false,
      });

      // Clear auth cookies
      await apiFetch(apiRoutes.auth.logout, { method: 'POST', headers, parseJson: false }).catch(() => {});
      notifyAuthChanged();
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete profile');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-[500px] w-full max-h-[90vh] overflow-y-auto border border-[#EFE2D0]">
        <div className="sticky top-0 bg-white/95 backdrop-blur z-10 px-6 py-5 border-b border-[#EFE2D0] flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-text-main m-0">Settings</h2>
            <p className="text-sm text-text-muted m-0 mt-1">Manage your account profile</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 text-text-muted hover:text-text-main rounded-full hover:bg-stone-100 transition-colors border-none bg-transparent cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {error && <div className="mb-4"><Notification type="error">{error}</Notification></div>}

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <label className="text-brand-color text-[0.82rem] font-extrabold uppercase tracking-widest">Username</label>
              <Input
                icon={<User size={18} className="text-gray-400" />}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-brand-color text-[0.82rem] font-extrabold uppercase tracking-widest">Email</label>
              <Input
                icon={<Mail size={18} className="text-gray-400" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-brand-color text-[0.82rem] font-extrabold uppercase tracking-widest">New Password (optional)</label>
              <Input
                icon={<Lock size={18} className="text-gray-400" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Leave blank to keep current"
              />
            </div>

            <div className="flex gap-3 mt-4 pt-4 border-t border-[#EFE2D0]">
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1 border-[#EFE2D0] bg-white hover:bg-stone-50 border">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-red-100">
            <h3 className="text-red-600 font-bold mb-2">Danger Zone</h3>
            <p className="text-sm text-text-muted mb-4">Once you delete your profile, there is no going back. Please be certain.</p>
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              onClick={handleDelete}
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <Trash2 size={16} className="mr-2" /> Delete Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
