import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { ApiRequestError, testProtectedRequest } from '../lib/api';

const SESSION_STORAGE_KEY = 'sentinelai.auth.token';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  token: string | null;
  isAuthenticated: boolean;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  verifySession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredToken(): string | null {
  try {
    const token = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    return token && token.trim().length > 0 ? token : null;
  } catch {
    return null;
  }
}

function persistToken(token: string): void {
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, token);
}

function removePersistedToken(): void {
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const logout = useCallback(() => {
    removePersistedToken();
    setToken(null);
    setStatus('unauthenticated');
  }, []);

  const verifySession = useCallback(async (): Promise<boolean> => {
    const activeToken = token ?? readStoredToken();

    if (!activeToken) {
      setToken(null);
      setStatus('unauthenticated');
      return false;
    }

    try {
      await testProtectedRequest(activeToken);
      setToken(activeToken);
      setStatus('authenticated');
      persistToken(activeToken);
      return true;
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        removePersistedToken();
        setToken(null);
        setStatus('unauthenticated');
        return false;
      }

      setToken(activeToken);
      setStatus('authenticated');
      return true;
    }
  }, [token]);

  const loginWithToken = useCallback(async (candidateToken: string): Promise<void> => {
    const normalizedToken = candidateToken.trim();

    if (!normalizedToken) {
      throw new Error('A valid authentication token is required.');
    }

    setStatus('loading');

    try {
      await testProtectedRequest(normalizedToken);
      persistToken(normalizedToken);
      setToken(normalizedToken);
      setStatus('authenticated');
    } catch (error) {
      setToken(null);
      setStatus('unauthenticated');

      if (error instanceof ApiRequestError && error.status === 401) {
        throw new Error('The supplied authentication token was rejected.', {
          cause: error,
        });
      }

      throw error;
    }
  }, []);

  useEffect(() => {
    const storedToken = readStoredToken();

    if (!storedToken) {
      setStatus('unauthenticated');
      return;
    }

    void verifySession();
  }, [verifySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      token,
      isAuthenticated: status === 'authenticated',
      loginWithToken,
      logout,
      verifySession,
    }),
    [loginWithToken, logout, status, token, verifySession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
