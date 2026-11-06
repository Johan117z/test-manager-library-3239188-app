import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { configureClient, login as apiLogin } from '../api/client.js';

const STORAGE_KEY = 'manager-library.session';
const AuthContext = createContext(null);

function readSession() {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (session?.token && session.expiresAt > Date.now()) return session;
  } catch {
    // Storage unavailable or corrupt: start signed out.
  }
  return null;
}

function writeSession(session) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures; the session still lives in memory.
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  const logout = useCallback(() => {
    writeSession(null);
    setSession(null);
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await apiLogin(username, password);
    const next = {
      token: data.access_token,
      role: data.role,
      username: username.trim().toLowerCase(),
      expiresAt: Date.now() + (data.expires_in || 28800) * 1000,
    };
    writeSession(next);
    setSession(next);
    return next;
  }, []);

  // Wire the HTTP client during render so the children's first requests already carry the token.
  configureClient({
    getToken: () => (session && session.expiresAt > Date.now() ? session.token : null),
    onUnauthorized: logout,
  });

  // Sign out automatically when the 8-hour token expires.
  useEffect(() => {
    if (!session) return undefined;
    const timer = setTimeout(logout, Math.max(0, session.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [session, logout]);

  const value = useMemo(
    () => ({ session, isAdmin: session?.role === 'admin', login, logout }),
    [session, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
