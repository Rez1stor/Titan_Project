import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Settings } from 'lucide-react';
import type { PublicUserProfileDto, UserPreferences, LibraryResponse } from '../types';
import UserSettingsModal from '../components/UserSettingsModal';
import PreferenceModal from '../components/PreferenceModal';
import { isAdminRole } from '../types';
import { avatarOptions, getAvatarStorageKey, pickAvatar, type AvatarChoice } from '../utils/avatar';
import { apiRoutes, notifyAuthChanged } from '../api/routes';
import { apiFetch } from '../utils/api';

export default function UserProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState<PublicUserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const avatarControlRef = useRef<HTMLDivElement>(null);
  const [avatarChoice, setAvatarChoice] = useState<AvatarChoice | null>(null);
  const [avatarDraftChoice, setAvatarDraftChoice] = useState<AvatarChoice | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [preferenceModalOpen, setPreferenceModalOpen] = useState(false);
  const isOwnProfile = !id;

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        if (id) {
          const data = await apiFetch<PublicUserProfileDto>(apiRoutes.users.byId(id));
          if (!active) return;
          setUser(data);
          return;
        }

        const data = await apiFetch<PublicUserProfileDto>(apiRoutes.auth.me);
        if (!active) return;
        setUser(data);

        try {
          const lib = await apiFetch<LibraryResponse>(apiRoutes.library);
          if (active) setPreferences(lib.preferences ?? null);
        } catch {
          // ignore error fetching library
        }
      } catch {
        if (active) setUser(null);
      }
    };

    void loadProfile()
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const avatar = useMemo(() => pickAvatar(user?.username ?? 'guest'), [user?.username]);
  const profileAvatar = useMemo(() => {
    const activeChoice = avatarDraftChoice ?? avatarChoice;
    if (activeChoice?.type === 'image') return activeChoice.value;
    if (activeChoice?.type === 'emoji') return activeChoice.value;
    return avatar;
  }, [avatar, avatarChoice, avatarDraftChoice]);

  const hasAvatarChanges = Boolean(avatarDraftChoice);

  const roleLabel = user?.role && isAdminRole(user.role) ? user.role : null;

  useEffect(() => {
    if (!user?.userId) {
      setAvatarChoice(null);
      setAvatarDraftChoice(null);
      return;
    }

    const raw = window.localStorage.getItem(getAvatarStorageKey(user.userId));
    if (!raw) {
      setAvatarChoice(null);
      setAvatarDraftChoice(null);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as AvatarChoice;
      if (parsed && (parsed.type === 'emoji' || parsed.type === 'image') && typeof parsed.value === 'string') {
        setAvatarChoice(parsed);
        setAvatarDraftChoice(null);
      } else {
        setAvatarChoice(null);
        setAvatarDraftChoice(null);
      }
    } catch {
      setAvatarChoice(null);
      setAvatarDraftChoice(null);
    }
  }, [user?.userId]);

  const saveAvatarChoice = (choice: AvatarChoice) => {
    setAvatarDraftChoice(choice);
  };

  const commitAvatarChanges = () => {
    if (!user?.userId || !avatarDraftChoice) return;
    window.localStorage.setItem(getAvatarStorageKey(user.userId), JSON.stringify(avatarDraftChoice));
    setAvatarChoice(avatarDraftChoice);
    setAvatarDraftChoice(null);
  };

  const handleEmojiSelect = (emoji: string) => {
    saveAvatarChoice({ type: 'emoji', value: emoji });
    setEmojiPickerOpen(false);
  };

  useEffect(() => {
    if (!emojiPickerOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (avatarControlRef.current && !avatarControlRef.current.contains(target)) {
        setEmojiPickerOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [emojiPickerOpen]);

  const handleLogout = async () => {
    await apiFetch(apiRoutes.auth.logout, { method: 'POST', parseJson: false });
    notifyAuthChanged();
    // Force a full reload so the app clears any transient state
    try { window.location.reload(); } catch { navigate('/login'); }
  };

  if (loading) {
    return <div className="p-20 text-center text-brand-color">Loading profile…</div>;
  }

  if (!user) {
    return (
      <div className="max-w-180 mx-auto py-12">
        <div className="bg-white border border-[#EFE2D0] rounded-[28px] p-7 shadow-[0_12px_36px_rgba(45,36,36,0.06)]">
          <h1 className="m-0 text-[2rem] text-text-main">You are not signed in</h1>
          <p className="text-gray-500 leading-relaxed my-3">Sign in to see your profile, saved preferences, and account role.</p>
          <Link to="/login" className="inline-flex items-center justify-center px-4.5 py-3 rounded-2xl bg-text-main text-orange-50 no-underline font-extrabold hover:bg-opacity-90 transition-colors">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-205 mx-auto py-10 px-5">
      <div className="bg-white border border-[#EFE2D0] rounded-[28px] p-7 shadow-[0_12px_36px_rgba(45,36,36,0.06)]">
        <div className="flex items-center gap-4.5 mb-6">
          <div
            ref={avatarControlRef}
            className="relative w-21 h-21 shrink-0"
          >
            <div className="w-21 h-21 rounded-3xl p-0 border border-[#EBDCC8] bg-linear-to-br from-orange-50 to-[#F5E2D1] overflow-hidden shrink-0" aria-label={isOwnProfile ? 'Profile avatar' : 'Profile avatar'}>
              {avatarChoice?.type === 'image' ? (
                <img src={profileAvatar} alt={user.username} className="w-full h-full object-cover block" />
              ) : (
                <span className="w-full h-full grid place-items-center text-3xl">{profileAvatar}</span>
              )}
            </div>

            {isOwnProfile && (
              <button
                type="button"
                onClick={() => setEmojiPickerOpen((current) => !current)}
                className="absolute -right-1.5 -bottom-1.5 w-7 h-7 rounded-full border border-[#EBDCC8] bg-text-main text-orange-50 grid place-items-center shadow-[0_10px_22px_rgba(45,36,36,0.18)] cursor-pointer hover:scale-105 transition-transform"
                aria-label="Change avatar"
              >
                <Pencil size={14} />
              </button>
            )}

            {isOwnProfile && emojiPickerOpen && (
              <div className="absolute top-[calc(100%+10px)] left-0 min-w-45 p-2 rounded-2xl border border-[#EBDCC8] bg-[#FFFDF9] shadow-[0_18px_36px_rgba(45,36,36,0.12)] z-20 flex flex-col gap-1.5">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(44px,1fr))] gap-2 mt-2.5">
                  {avatarOptions.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleEmojiSelect(emoji)}
                      className="h-11 rounded-xl border border-[#EBDCC8] bg-white text-[1.2rem] cursor-pointer hover:bg-gray-50 transition-colors"
                      aria-label={`Use ${emoji} as avatar`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center gap-4">
              <div>
                <div className="text-[#A0522D] uppercase tracking-widest font-black text-xs">{isOwnProfile ? 'My Profile' : 'User Profile'}</div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="my-2 text-[2.2rem] text-text-main leading-none font-bold">{user.username}</h1>
                  {roleLabel && (
                    <span className="inline-flex items-center px-2.5 py-1.5 rounded-full bg-text-main text-orange-50 text-xs font-extrabold tracking-wide uppercase">{roleLabel}</span>
                  )}
                </div>
                <div className="text-gray-500">{user.email}</div>
              </div>
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="p-2.5 rounded-full bg-[#FAF8F5] border border-[#EBDCC8] text-brand-color cursor-pointer hover:bg-[#EFE2D0] transition-colors"
                  aria-label="Profile settings"
                >
                  <Settings size={20} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
          <div className="bg-[#FAF8F5] border border-[#EBDCC8] rounded-2xl p-4.5">
            <div className="text-brand-color uppercase tracking-widest text-[0.72rem] font-black mb-2">Country</div>
            <div className="text-text-main font-extrabold">{user.country ?? 'Not set'}</div>
          </div>
          {user.createdAt && (
            <div className="bg-[#FAF8F5] border border-[#EBDCC8] rounded-2xl p-4.5">
              <div className="text-brand-color uppercase tracking-widest text-[0.72rem] font-black mb-2">Joined</div>
              <div className="text-text-main font-extrabold">{new Date(user.createdAt).toLocaleDateString()}</div>
            </div>
          )}
          {typeof user.reviewsCount === 'number' && (
            <div className="bg-[#FAF8F5] border border-[#EBDCC8] rounded-2xl p-4.5">
              <div className="text-brand-color uppercase tracking-widest text-[0.72rem] font-black mb-2">Reviews</div>
              <div className="text-text-main font-extrabold">{user.reviewsCount}</div>
            </div>
          )}
        </div>

        {isOwnProfile && preferences && (preferences.targetAbv || preferences.preferredTags?.length) && (
          <div className="mt-8 pt-6 border-t border-[#EFE2D0]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="m-0 text-[1.4rem] font-bold text-text-main">My Preferences</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreferenceModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#EBDCC8] bg-white text-brand-color text-sm font-bold cursor-pointer hover:bg-orange-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await apiFetch(apiRoutes.library + '/prefs', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ targetAbv: null, abvTolerance: null, maxPrice: null, preferredTags: [] })
                    });
                    setPreferences(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm font-bold cursor-pointer hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.targetAbv && (
                <span className="px-3 py-1 bg-white border border-[#EBDCC8] rounded-full text-sm font-bold text-brand-color">
                  Strength: ~{preferences.targetAbv}%
                </span>
              )}
              {preferences.maxPrice && (
                <span className="px-3 py-1 bg-white border border-[#EBDCC8] rounded-full text-sm font-bold text-brand-color">
                  Max Price: {preferences.maxPrice} PLN
                </span>
              )}
              {preferences.preferredTags?.map(tag => (
                <span key={tag} className="px-3 py-1 bg-orange-100 border border-orange-200 rounded-full text-sm font-bold text-amber-800">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        {!preferences?.targetAbv && isOwnProfile && (
          <div className="mt-8 pt-6 border-t border-[#EFE2D0]">
            <div className="flex justify-between items-center">
              <h2 className="m-0 text-[1.4rem] font-bold text-text-main">My Preferences</h2>
              <button
                type="button"
                onClick={() => setPreferenceModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg border border-brand-color bg-brand-color text-white text-sm font-bold cursor-pointer hover:bg-opacity-90 transition-colors"
              >
                Set up
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2 mb-0">Set your alcohol preferences to get personalized recommendations.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-8">
          {isOwnProfile && (
            <button
              type="button"
              onClick={commitAvatarChanges}
              disabled={!hasAvatarChanges}
              className={`px-4.5 py-3 rounded-2xl bg-text-main text-orange-50 border border-text-main font-extrabold transition-opacity ${hasAvatarChanges ? 'opacity-100 cursor-pointer hover:bg-black' : 'opacity-55 cursor-not-allowed'}`}
            >
              Save changes
            </button>
          )}
          <Link to="/catalog" className="inline-flex items-center justify-center px-4.5 py-3 rounded-2xl bg-[#FAF5EE] text-brand-color no-underline font-extrabold border border-[#EBDCC8] hover:bg-orange-50 transition-colors">Go to catalog</Link>
          {isOwnProfile && <button type="button" onClick={handleLogout} className="px-4.5 py-3 rounded-2xl bg-red-50 text-red-700 border border-red-300 font-extrabold cursor-pointer hover:bg-red-100 transition-colors">Logout</button>}
        </div>
      </div>

      {isOwnProfile && settingsOpen && (
        <UserSettingsModal
          user={user}
          onClose={() => setSettingsOpen(false)}
          onSuccess={(updatedUser) => {
            setUser(updatedUser);
            setSettingsOpen(false);
          }}
        />
      )}

      {preferenceModalOpen && (
        <PreferenceModal
          onSave={async (profile) => {
            const tags = [
              ...profile.categories,
              ...profile.primaryChoices,
              ...profile.secondaryChoices
            ].filter(t => t !== 'All' && t.trim() !== '');

            let maxPrice: number | null = null;
            if (profile.priceBands.includes('Budget')) maxPrice = 25;
            if (profile.priceBands.includes('Classic')) maxPrice = 40;
            if (profile.priceBands.includes('Premium')) maxPrice = 70;
            if (profile.priceBands.includes('Luxury')) maxPrice = 1000;
            if (profile.priceBands.includes('Any')) maxPrice = null;

            const prefs: UserPreferences = {
              targetAbv: profile.strength,
              abvTolerance: 3.5,
              maxPrice,
              preferredTags: tags
            };

            await apiFetch(apiRoutes.library + '/prefs', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(prefs)
            });

            setPreferences(prefs);
            setPreferenceModalOpen(false);
          }}
          onSkip={() => setPreferenceModalOpen(false)}
        />
      )}
    </div>
  );
}