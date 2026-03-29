import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, authStorage } from '../../../shared/api/api';
import { RegisterRequest } from '../../../shared/types';

const ROUTE_LOGIN = '/login';
const ROUTE_DIRECTORY = '/directory';

export function useAuth() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(authStorage.isAuthenticated());
  const [username, setUsernameState] = useState(authStorage.getUsername() ?? '');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const setAuthUsername = useCallback((nextUsername: string) => {
    setUsernameState(nextUsername);
    authStorage.setUsername(nextUsername);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const expireSession = useCallback((message = 'Your session expired. Please log in again.') => {
    authStorage.clearSession();
    setIsAuthenticated(false);
    setUsernameState('');
    setAuthError(message);
    navigate(ROUTE_LOGIN);
  }, [navigate]);

  const login = useCallback(async (loginUsername: string, loginPassword: string): Promise<boolean> => {
    try {
      setAuthLoading(true);
      const response = await authApi.login({ username: loginUsername, password: loginPassword });
      authStorage.saveSession(response.data);
      setUsernameState(response.data.username);
      setIsAuthenticated(true);
      setAuthError(null);
      navigate(ROUTE_DIRECTORY);
      return true;
    } catch (err) {
      setAuthError('Invalid username or password.');
      console.error(err);
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
      setUsernameState(response.data.username);
      setIsAuthenticated(true);
      setAuthError(null);
      navigate(ROUTE_DIRECTORY);
      return true;
    } catch (err) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setAuthError(axiosError.response?.data?.error ?? 'Registration failed.');
      console.error(err);
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(() => {
    authStorage.clearSession();
    setIsAuthenticated(false);
    setUsernameState('');
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
    setAuthUsername,
    username,
  };
}
