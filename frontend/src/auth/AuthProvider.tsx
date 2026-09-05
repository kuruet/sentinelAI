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
  authError: string | null;
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

function getAuthenticationError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) {
      return 'The supplied authentication token was rejected.';
    }

    if (error.status === 403) {
      return 'Your account is not permitted to access SentinelAI.';
    }

    if (error.status === 0) {
      return 'The authentication service could not be reached. Check that the backend is running and try again.';
    }

    return 'The authentication service could not complete the request. Please try again.';
  }

  return 'The authentication service could not complete the request. Please try again.';
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [authError, setAuthError] = useState<string | null>(null);

  const logout = useCallback(() => {
    removePersistedToken();
    setToken(null);
    setAuthError(null);
    setStatus('unauthenticated');
  }, []);

  const verifySession = useCallback(async (): Promise<boolean> => {
    const activeToken = token ?? readStoredToken();

    if (!activeToken) {
      setToken(null);
      setAuthError(null);
      setStatus('unauthenticated');
      return false;
    }

    setAuthError(null);

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
        setAuthError('Your session has expired or is no longer valid. Please sign in again.');
        setStatus('unauthenticated');
        return false;
      }

      setToken(null);
      setAuthError(getAuthenticationError(error));
      setStatus('unauthenticated');
      return false;
    }
  }, [token]);

  const loginWithToken = useCallback(async (candidateToken: string): Promise<void> => {
    const normalizedToken = candidateToken.trim();

    if (!normalizedToken) {
      throw new Error('A valid authentication token is required.');
    }

    setAuthError(null);

    try {
      await testProtectedRequest(normalizedToken);
      persistToken(normalizedToken);
      setToken(normalizedToken);
      setStatus('authenticated');
    } catch (error) {
      setToken(null);
      setStatus('unauthenticated');

      const message = getAuthenticationError(error);
      setAuthError(message);
      throw new Error(message, {
        cause: error,
      });
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
      authError,
      isAuthenticated: status === 'authenticated',
      loginWithToken,
      logout,
      verifySession,
    }),
    [authError, loginWithToken, logout, status, token, verifySession],
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
