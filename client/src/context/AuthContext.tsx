// Keeps track of the logged in user and their privileges for the whole app.
// Any component can call useAuth() to get the user, login(), logout() or can().
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { api, tokenStorage } from '../api/client';
import { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  /** true if the user has the given privilege, e.g. can('products.manage') */
  can: (privilege: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On page load: if we have a saved token, ask the server who we are.
  useEffect(() => {
    if (!tokenStorage.get()) {
      setLoading(false);
      return;
    }
    api
      .get<AuthUser>('/auth/me')
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const result = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password });
    tokenStorage.set(result.token);
    setUser(result.user);
  }

  function logout() {
    tokenStorage.clear();
    setUser(null);
  }

  const can = (privilege: string) => Boolean(user?.privileges.includes(privilege));

  return <AuthContext.Provider value={{ user, loading, login, logout, can }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
