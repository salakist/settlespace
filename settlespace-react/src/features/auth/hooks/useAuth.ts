import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, authStorage } from '../../../shared/api/api';
import { logHandledError } from '../../../shared/api/requestHandling';
import { PersonRole, RegisterRequest } from '../../../shared/types';

const ROUTE_LOGIN = '/login';
const ROUTE_HOME = '/home';

export function useAuth() {
  const navigate = useNavigate();
  const initialRole = typeof authStorage.getRole === 'function'
    ? authStorage.getRole()
    : null;
  const [isAuthenticated, setIsAuthenticated] = useState(authStorage.isAuthenticated());
  const [username, setUsername] = useState(authStorage.getUsername() ?? '');
  const [role, setRole] = useState<PersonRole | null>(initialRole);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const setAuthUsername = useCallback((nextUsername: string) => {
    setUsername(nextUsername);
    authStorage.setUsername(nextUsername);
  }, []);

  const setAuthRole = useCallback((nextRole: PersonRole) => {
    setRole(nextRole);
    if (typeof authStorage.setRole === 'function') {
      authStorage.setRole(nextRole);
    }
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const expireSession = useCallback((message = 'Your session expired. Please log in again.') => {
    authStorage.clearSession();
    setIsAuthenticated(false);
    setUsername('');
    setRole(null);
    setAuthError(message);
    navigate(ROUTE_LOGIN);
  }, [navigate]);

  const login = useCallback(async (loginUsername: string, loginPassword: string): Promise<boolean> => {
    try {
      setAuthLoading(true);
      const response = await authApi.login({ username: loginUsername, password: loginPassword });
      authStorage.saveSession(response.data);
      setUsername(response.data.username);
      setRole(response.data.role);
      setIsAuthenticated(true);
      setAuthError(null);
      navigate(ROUTE_HOME);
      return true;
    } catch (err) {
      setAuthError('Invalid username or password.');
      logHandledError(err);
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [navigate]);

  const register = useCallback(async (request: RegisterRequest): Promise<boolean> => {
    try {
      setAuthLoading(true);
      const response = await authApi.register(request);
      authStorage.saveSession(response.data);
      setUsername(response.data.username);
      setRole(response.data.role);
      setIsAuthenticated(true);
      setAuthError(null);
      navigate(ROUTE_HOME);
      return true;
    } catch (err) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setAuthError(axiosError.response?.data?.error ?? 'Registration failed.');
      logHandledError(err);
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(() => {
    authStorage.clearSession();
    setIsAuthenticated(false);
    setUsername('');
    setRole(null);
    setAuthError(null);
    navigate(ROUTE_LOGIN);
  }, [navigate]);

  return {
    authError,
    authLoading,
    clearAuthError,
    expireSession,
    isAuthenticated,
    login,
    logout,
    register,
    role,
    setAuthRole,
    setAuthUsername,
    username,
  };
}
