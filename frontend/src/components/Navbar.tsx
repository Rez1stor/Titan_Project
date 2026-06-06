import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { AuthUserDto } from '../types';
import { isAdminRole } from '../types';
import { AUTH_CHANGED_EVENT, apiRoutes } from '../api/routes';
import { pickAvatar, getAvatarStorageKey, type AvatarChoice } from '../utils/avatar';
import { apiFetch } from '../utils/api';

export default function Navbar() {
  const [user, setUser] = useState<AuthUserDto | null>(null);
  const [avatarObj, setAvatarObj] = useState<AvatarChoice | null>(null);

  useEffect(() => {
    let active = true;

    const fetchMe = () => {
      apiFetch<AuthUserDto>(apiRoutes.auth.me)
        .then((user) => {
          if (!active) return;
          setUser(user);
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

    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);

    return () => {
      active = false;
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    };
  }, []);

  useEffect(() => {
    const loadAvatar = () => {
      if (!user?.userId) {
        setAvatarObj(null);
        return;
      }
      try {
        const raw = window.localStorage.getItem(getAvatarStorageKey(user.userId));
        if (raw) {
          const parsed = JSON.parse(raw) as AvatarChoice;
          if (parsed.type === 'emoji' || parsed.type === 'image') {
            setAvatarObj(parsed);
          } else {
            setAvatarObj(null);
          }
        } else {
          setAvatarObj(null);
        }
      } catch {
        setAvatarObj(null);
      }
    };

    loadAvatar();

    const onAvatarChanged = () => loadAvatar();
    window.addEventListener('titan-avatar-changed', onAvatarChanged);
    window.addEventListener('storage', onAvatarChanged);

    return () => {
      window.removeEventListener('titan-avatar-changed', onAvatarChanged);
      window.removeEventListener('storage', onAvatarChanged);
    };
  }, [user?.userId]);

  const defaultAvatar = useMemo(() => pickAvatar(user?.username ?? 'guest'), [user?.username]);
  const avatarValue = avatarObj ? avatarObj.value : defaultAvatar;

  const navigate = useNavigate();

  const handleAddProduct = () => {
    if (!isAdminRole(user?.role)) {
      alert('Only administrators can add products.');
      return;
    }

    navigate('/product/create');
  };

  return (
    <nav className="px-10 py-5 bg-bg-card border-b border-border-color flex items-center justify-between">
      
      {/* Brand logo */}
      <Link to="/" className="text-2xl font-black text-brand-color tracking-[-1.5px]">
        <span className="text-[#A0522D]">TITAN</span>
      </Link>
      
      {/* Nav Links */}
      <div className="flex items-center gap-9">
        <Link to="/catalog" className="text-brand-color font-semibold text-[0.95rem] hover:text-brand-hover transition-colors">
          Catalog
        </Link>
        <Link to="/favorites" className="text-brand-color font-semibold text-[0.95rem] hover:text-brand-hover transition-colors">
          Favorites
        </Link>
        <Link to="/recommendations" className="text-brand-color font-semibold text-[0.95rem] hover:text-brand-hover transition-colors">
          For You
        </Link>

        {user && isAdminRole(user.role) && (
          <button
            type="button"
            onClick={handleAddProduct}
            className="bg-text-main text-orange-50 px-4.5 py-2.5 rounded-xl font-extrabold text-sm cursor-pointer hover:bg-black transition-colors"
          >
            Add Product
          </button>
        )}

        {user ? (
          <Link to="/profile" className="ml-2.5 bg-brand-color text-white pl-2.5 pr-3.5 py-2 rounded-full font-bold text-sm shadow-[0_4px_12px_rgba(93,64,55,0.15)] inline-flex items-center gap-2.5 hover:bg-brand-hover transition-colors">
            <span className="w-[30px] h-[30px] rounded-full bg-white/16 grid place-items-center text-base overflow-hidden" aria-hidden="true">
              {avatarObj?.type === 'image' ? (
                <img src={avatarValue} alt={user.username} className="w-full h-full object-cover block" />
              ) : (
                <span>{avatarValue}</span>
              )}
            </span>
            My Profile
          </Link>
        ) : (
          <Link to="/login" className="ml-2.5 bg-brand-color text-white px-6.5 py-2.5 rounded-xl font-bold text-sm shadow-[0_4px_12px_rgba(93,64,55,0.15)] hover:bg-brand-hover transition-colors">
            Sign In
          </Link>
        )}
      </div>

    </nav>
  );
}