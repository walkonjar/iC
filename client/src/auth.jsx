import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggedOut, setLoggedOut] = useState(false);

  useEffect(() => {
    api.get('/api/auth/me').then((d) => setUser(d.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = async (body) => { const d = await api.post('/api/auth/login', body); setLoggedOut(false); setUser(d.user); };
  // Registrasi langsung membuat sesi aktif; GuestRoute otomatis mengarahkan ke Beranda.
  const register = async (body) => { const d = await api.post('/api/auth/register', body); setLoggedOut(false); setUser(d.user); };
  const logout = async () => { await api.post('/api/auth/logout').catch(() => {}); setLoggedOut(true); setUser(null); };

  return (
    <AuthContext value={{ user, setUser, loading, loggedOut, login, register, logout }}>
      {children}
    </AuthContext>
  );
}
