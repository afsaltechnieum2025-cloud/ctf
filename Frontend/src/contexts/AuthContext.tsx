import { createContext, useContext, useState, ReactNode } from 'react';
import { API as API_BASE } from '@/utils/api';
const API = `${API_BASE}/auth`;

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: string | null;
  username: string | null;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Defensive: lowercase role so checks like role === 'salesteam' or
// staffRoles.includes(role) work regardless of how the DB stores casing.
const normalizeUser = (u: any): User | null => {
  if (!u) return null;
  return { ...u, role: typeof u.role === 'string' ? u.role.toLowerCase() : u.role };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? normalizeUser(JSON.parse(saved)) : null;
  });

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) return { error: data.error || 'Login failed' };

      const normalized = normalizeUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(normalized));
      setToken(data.token);
      setUser(normalized);
      return { error: null };
    } catch (err) {
      return { error: 'Server error. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      role: user?.role ?? null,
      username: user?.name ?? null,
      login,
      logout,
      isAuthenticated: !!token,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}