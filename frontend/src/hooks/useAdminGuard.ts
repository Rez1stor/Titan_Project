import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRoutes } from '../api/routes';
import { apiFetch } from '../utils/api';
import { isAdminRole } from '../types';

const ACCESS_DENIED_MESSAGE = 'Access denied: administrators or moderators only';

/**
 * Redirects to login when the current user is not Admin/Moderator.
 */
export default function useAdminGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    apiFetch<{ role?: string | null }>(apiRoutes.auth.me)
      .then((user) => {
        if (!active) return;
        if (!isAdminRole(user?.role)) {
          alert(ACCESS_DENIED_MESSAGE);
          navigate('/login');
        }
      })
      .catch(() => {
        if (!active) return;
        alert(ACCESS_DENIED_MESSAGE);
        navigate('/login');
      });

    return () => {
      active = false;
    };
  }, [navigate]);
}
