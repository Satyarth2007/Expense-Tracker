import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import api from '../lib/axios';

// NOTE: renamed from `name` (stub) to `fullName` — that's the field your
// backend's authController.ts actually returns. Grep for `user.name` /
// `user?.name` elsewhere in the app and update to `user.fullName`.
interface User {
  id: string;
  email: string;
  fullName: string;
  workspaceId: string;
}

interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  otp: string;
}

// authController's error responses are either a plain string or a Zod
// .flatten() shape. Export so components can type their catch blocks.
export interface ApiErrorResponse {
  error: string | { formErrors: string[]; fieldErrors: Record<string, string[]> };
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // true until the initial silent-refresh check settles
  login: (email: string, password: string) => Promise<void>;
  sendOtp: (email: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'token'; // kept as-is from your stub, not renamed to accessToken
const USER_KEY = 'user';

function persistSession(data: {
  accessToken: string;
  user: { id: string; email: string; fullName: string };
  workspaceId: string;
}) {
  const fullUser: User = { ...data.user, workspaceId: data.workspaceId };
  localStorage.setItem(TOKEN_KEY, data.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(fullUser));
  return fullUser;
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  );
  const [isLoading, setIsLoading] = useState(true);

  // On app load, a stored token might be stale (expired, or revoked by a
  // logout-all on another device). This confirms it's still good and gets
  // a fresh one via the httpOnly refresh cookie — /auth/refresh only
  // returns { accessToken }, no user, so the user comes from localStorage.
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        setToken(data.accessToken);
        const stored = localStorage.getItem(USER_KEY);
        if (stored) setUser(JSON.parse(stored) as User);
      } catch {
        clearSession();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    const fullUser = persistSession(data);
    setToken(data.accessToken);
    setUser(fullUser);
  }

  // Step 1 of registration: emails the OTP. registerSchema's own duplicate-
  // email check (409) surfaces here rather than at final submit.
  async function sendOtp(email: string) {
    await api.post('/auth/send-otp', { email });
  }

  // Step 2 (final): backend verifies the OTP against Redis and, only on
  // success, runs the atomic transaction that creates the user + workspace.
  async function register(payload: RegisterPayload) {
    const { data } = await api.post('/auth/register', payload);
    const fullUser = persistSession(data);
    setToken(data.accessToken);
    setUser(fullUser);
  }

  async function forgotPassword(email: string) {
    await api.post('/auth/forgot-password', { email });
  }

  // resetPassword revokes all sessions server-side, so any locally-stored
  // session is dead too — clear it rather than leaving a stale token around.
  async function resetPassword(resetToken: string, newPassword: string) {
    await api.post('/auth/reset-password', { token: resetToken, newPassword });
    clearSession();
    setToken(null);
    setUser(null);
  }

  // Both routes use requireRefreshAuth middleware — reads the refresh
  // token off the httpOnly cookie server-side, no body needed.
  async function logout() {
    await api.post('/auth/logout');
    clearSession();
    setToken(null);
    setUser(null);
  }

  async function logoutAll() {
    await api.post('/auth/logout-all');
    clearSession();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        sendOtp,
        register,
        forgotPassword,
        resetPassword,
        logout,
        logoutAll,
      }}
    >
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