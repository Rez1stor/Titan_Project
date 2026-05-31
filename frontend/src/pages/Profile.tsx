import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';

type AuthUserDto = {
  userId: number;
  username: string;
  email: string;
  country?: string | null;
  role?: string | null;
};

type PublicUserProfileDto = {
  userId: number;
  username: string;
  email: string;
  country?: string | null;
  role?: string | null;
  createdAt?: string;
  reviewsCount?: number;
};

const avatarOptions = ['🍺', '🍷', '🥂', '🍾', '🍸', '🫗', '🌿', '⭐', '🍻', '🍹', '🍑', '🍒'];
const AVATAR_STORAGE_PREFIX = 'titan-profile-avatar:';

type AvatarChoice = {
  type: 'emoji' | 'image';
  value: string;
};

function pickAvatar(username: string) {
  const normalized = username.trim().toLowerCase();
  let hash = 0;

  for (const character of normalized) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return avatarOptions[hash % avatarOptions.length];
}

function getAvatarStorageKey(userId?: number | null) {
  return `${AVATAR_STORAGE_PREFIX}${userId ?? 'guest'}`;
}

export default function Profile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState<PublicUserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarControlRef = useRef<HTMLDivElement>(null);
  const [avatarChoice, setAvatarChoice] = useState<AvatarChoice | null>(null);
  const [avatarDraftChoice, setAvatarDraftChoice] = useState<AvatarChoice | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const isOwnProfile = !id;

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        if (id) {
          const response = await fetch(`/api/users/${id}`);
          if (!active) return;
          if (!response.ok) {
            setUser(null);
            return;
          }

          const data = await response.json() as PublicUserProfileDto;
          setUser(data);
          return;
        }

        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (!active) return;
        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json() as AuthUserDto;
        setUser(data);
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
  }, []);

  const avatar = useMemo(() => pickAvatar(user?.username ?? 'guest'), [user?.username]);
  const profileAvatar = useMemo(() => {
    const activeChoice = avatarDraftChoice ?? avatarChoice;
    if (activeChoice?.type === 'image') return activeChoice.value;
    if (activeChoice?.type === 'emoji') return activeChoice.value;
    return avatar;
  }, [avatar, avatarChoice, avatarDraftChoice]);

  const hasAvatarChanges = Boolean(avatarDraftChoice);

  const roleLabel = user?.role && (user.role === 'Admin' || user.role === 'Moderator') ? user.role : null;

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

  const handleAvatarFile = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      if (result) saveAvatarChoice({ type: 'image', value: result });
    };
    reader.readAsDataURL(file);
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
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    try { window.dispatchEvent(new Event('auth-changed')); } catch {}
    // Force a full reload so the app clears any transient state
    try { window.location.reload(); } catch { navigate('/login'); }
  };

  if (loading) {
    return <div style={{ padding: '80px', textAlign: 'center', color: '#5D4037' }}>Loading profile…</div>;
  }

  if (!user) {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 0' }}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>You are not signed in</h1>
          <p style={textStyle}>Sign in to see your profile, saved preferences, and account role.</p>
          <Link to="/login" style={primaryLinkStyle}>Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '40px 0' }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '24px' }}>
          <div
            ref={avatarControlRef}
            style={avatarControlWrapperStyle}
          >
            <div style={avatarButtonStyle} aria-label={isOwnProfile ? 'Profile avatar' : 'Profile avatar'}>
              {avatarChoice?.type === 'image' ? (
                <img src={profileAvatar} alt={user.username} style={avatarImageStyle} />
              ) : (
                <span style={avatarEmojiStyle}>{profileAvatar}</span>
              )}
            </div>

            {isOwnProfile ? (
              <button
                type="button"
                onClick={() => setEmojiPickerOpen((current) => !current)}
                style={avatarPencilButtonStyle}
                aria-label="Change avatar"
              >
                <Pencil size={14} />
              </button>
            ) : null}

            {isOwnProfile && emojiPickerOpen ? (
              <div style={avatarPopupMenuStyle}>
                <button type="button" onClick={() => fileInputRef.current?.click()} style={avatarPopupMenuItemStyle}>
                  Upload photo
                </button>
                <div style={emojiGridStyle}>
                  {avatarOptions.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleEmojiSelect(emoji)}
                      style={emojiButtonStyle}
                      aria-label={`Use ${emoji} as avatar`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div>
            <div style={{ color: '#A0522D', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 900, fontSize: '0.75rem' }}>{isOwnProfile ? 'My Profile' : 'User Profile'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: '8px 0 6px', fontSize: '2.2rem', color: '#2D2424' }}>{user.username}</h1>
              {roleLabel ? (
                <span style={roleBadgeStyle}>{roleLabel}</span>
              ) : null}
            </div>
            <div style={{ color: '#6B7280' }}>{user.email}</div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(event) => handleAvatarFile(event.target.files?.[0])}
        />

        <div style={gridStyle}>
          <div style={infoCardStyle}>
            <div style={infoLabelStyle}>Country</div>
            <div style={infoValueStyle}>{user.country ?? 'Not set'}</div>
          </div>
          {user.createdAt ? (
            <div style={infoCardStyle}>
              <div style={infoLabelStyle}>Joined</div>
              <div style={infoValueStyle}>{new Date(user.createdAt).toLocaleDateString()}</div>
            </div>
          ) : null}
          {typeof user.reviewsCount === 'number' ? (
            <div style={infoCardStyle}>
              <div style={infoLabelStyle}>Reviews</div>
              <div style={infoValueStyle}>{user.reviewsCount}</div>
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          {isOwnProfile ? (
            <button
              type="button"
              onClick={commitAvatarChanges}
              disabled={!hasAvatarChanges}
              style={{
                ...saveButtonStyle,
                opacity: hasAvatarChanges ? 1 : 0.55,
                cursor: hasAvatarChanges ? 'pointer' : 'not-allowed',
              }}
            >
              Save changes
            </button>
          ) : null}
          <Link to="/catalog" style={secondaryLinkStyle}>Go to catalog</Link>
          {isOwnProfile ? <button type="button" onClick={handleLogout} style={logoutButtonStyle}>Logout</button> : null}
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #EFE2D0',
  borderRadius: '28px',
  padding: '28px',
  boxShadow: '0 12px 36px rgba(45, 36, 36, 0.06)',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '2rem',
  color: '#2D2424',
};

const textStyle: React.CSSProperties = {
  color: '#6B7280',
  lineHeight: 1.7,
  margin: '12px 0 20px',
};

const primaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 18px',
  borderRadius: '14px',
  background: '#2D2424',
  color: '#FFF7ED',
  textDecoration: 'none',
  fontWeight: 800,
};

const secondaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 18px',
  borderRadius: '14px',
  background: '#FAF5EE',
  color: '#5D4037',
  textDecoration: 'none',
  fontWeight: 800,
  border: '1px solid #EBDCC8',
};

const logoutButtonStyle: React.CSSProperties = {
  padding: '12px 18px',
  borderRadius: '14px',
  background: '#FFF5F5',
  color: '#C53030',
  border: '1px solid #FC8181',
  fontWeight: 800,
  cursor: 'pointer',
};

const saveButtonStyle: React.CSSProperties = {
  padding: '12px 18px',
  borderRadius: '14px',
  background: '#2D2424',
  color: '#FFF7ED',
  border: '1px solid #2D2424',
  fontWeight: 800,
};

const avatarButtonStyle: React.CSSProperties = {
  width: '84px',
  height: '84px',
  borderRadius: '24px',
  padding: 0,
  border: '1px solid #EBDCC8',
  background: 'linear-gradient(135deg, #FFF7ED 0%, #F5E2D1 100%)',
  overflow: 'hidden',
  flexShrink: 0,
};

const avatarImageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const avatarEmojiStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'grid',
  placeItems: 'center',
  fontSize: '2rem',
};

const roleBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 10px',
  borderRadius: '999px',
  background: '#2D2424',
  color: '#FFF7ED',
  fontSize: '0.8rem',
  fontWeight: 800,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const avatarControlWrapperStyle: React.CSSProperties = {
  position: 'relative',
  width: '84px',
  height: '84px',
  flexShrink: 0,
};

const avatarPencilButtonStyle: React.CSSProperties = {
  position: 'absolute',
  right: '-6px',
  bottom: '-6px',
  width: '28px',
  height: '28px',
  borderRadius: '999px',
  border: '1px solid #EBDCC8',
  background: '#2D2424',
  color: '#FFF7ED',
  display: 'grid',
  placeItems: 'center',
  boxShadow: '0 10px 22px rgba(45, 36, 36, 0.18)',
  cursor: 'pointer',
};

const avatarPopupMenuStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 10px)',
  left: '0',
  minWidth: '180px',
  padding: '8px',
  borderRadius: '16px',
  border: '1px solid #EBDCC8',
  background: '#FFFDF9',
  boxShadow: '0 18px 36px rgba(45, 36, 36, 0.12)',
  zIndex: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const avatarPopupMenuItemStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '12px',
  border: '1px solid #EBDCC8',
  background: '#FFF',
  color: '#2D2424',
  fontWeight: 800,
  cursor: 'pointer',
  textAlign: 'left',
};

const emojiGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(44px, 1fr))',
  gap: '8px',
  marginTop: '10px',
};

const emojiButtonStyle: React.CSSProperties = {
  height: '44px',
  borderRadius: '12px',
  border: '1px solid #EBDCC8',
  background: '#FFF',
  fontSize: '1.2rem',
  cursor: 'pointer',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '14px',
};

const infoCardStyle: React.CSSProperties = {
  background: '#FAF8F5',
  border: '1px solid #EBDCC8',
  borderRadius: '20px',
  padding: '18px',
};

const infoLabelStyle: React.CSSProperties = {
  color: '#5D4037',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontSize: '0.72rem',
  fontWeight: 900,
  marginBottom: '8px',
};

const infoValueStyle: React.CSSProperties = {
  color: '#2D2424',
  fontWeight: 800,
};