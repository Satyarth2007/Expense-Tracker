import { createContext, useContext, useState, type ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  async function login(email: string, password: string) {
    // STUB — replace with real API call once /auth/login is ready
    await new Promise((resolve) => setTimeout(resolve, 700));

    if (!email.includes('@') || password.length < 4) {
      throw new Error('Invalid credentials');
    }

    const fakeToken = 'stub-jwt-token';
    const fakeUser: User = { id: '1', email };

    localStorage.setItem('token', fakeToken);
    setToken(fakeToken);
    setUser(fakeUser);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}