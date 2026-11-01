import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../api.js';

const AuthContext = createContext(null);

async function request(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json().catch(() => ({})) : null;
  if (payload === null) {
    const error = new Error('Server API tidak terhubung. Backend belum aktif atau VITE_API_BASE_URL / proxy /api di Vercel belum diatur.');
    error.status = response.status || 503;
    throw error;
  }
  if (!response.ok) {
    const error = new Error(payload.message || 'Permintaan belum dapat diproses.');
    error.status = response.status;
    throw error;
  }
  return payload;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    request('/api/auth/me')
      .then(({ user: currentUser }) => { if (active) setUser(currentUser); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async login(username, password) {
      const result = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setUser(result.user);
      return result.user;
    },
    async logout() {
      try { await request('/api/auth/logout', { method: 'POST' }); } finally { setUser(null); }
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth harus digunakan di dalam AuthProvider.');
  return value;
}
