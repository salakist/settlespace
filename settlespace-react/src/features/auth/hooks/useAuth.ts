import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../../../app/constants';
import { logHandledError } from '../../../shared/api/requestHandling';
import { SESSION_EXPIRED_MESSAGE } from '../../../shared/constants/messages';
import { PersonRole } from '../../../shared/types';
import { clearPersonDirectoryCache } from '../../persons/hooks/usePersonDirectory';
import { authApi } from '../api';
import { AUTH_ERROR_MESSAGES } from '../constants';
import { authStorage } from '../storage';
import { RegisterRequest } from '../types';

export function useAuth() {
  const navigate = useNavigate();
  const initialRole = typeof authStorage.getRole === 'function'
    ? authStorage.getRole()
    : null;
  const [isAuthenticated, setIsAuthenticated] = useState(authStorage.isAuthenticated());
  const [username, setUsername] = useState(authStorage.getUsername() ?? '');
  const [personId, setPersonId] = useState(authStorage.getPersonId() ?? '');
  const [displayName, setDisplayName] = useState(authStorage.getDisplayName() ?? authStorage.getUsername() ?? '');
  const [role, setRole] = useState<PersonRole | null>(initialRole);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const setAuthUsername = useCallback((nextUsername: string) => {
    setUsername(nextUsername);
    authStorage.setUsername(nextUsername);
  }, []);

  const setAuthPersonId = useCallback((nextPersonId: string) => {
    setPersonId(nextPersonId);
    if (typeof authStorage.setPersonId === 'function') {
      authStorage.setPersonId(nextPersonId);
    }
  }, []);

  const setAuthDisplayName = useCallback((nextDisplayName: string) => {
    setDisplayName(nextDisplayName);
    if (typeof authStorage.setDisplayName === 'function') {
      authStorage.setDisplayName(nextDisplayName);
    }
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

  const expireSession = useCallback((message = SESSION_EXPIRED_MESSAGE) => {
    authStorage.clearSession();
    clearPersonDirectoryCache();
    setIsAuthenticated(false);
    setUsername('');
    setPersonId('');
    setDisplayName('');
    setRole(null);
    setAuthError(message);
    navigate(APP_ROUTES.LOGIN);
  }, [navigate]);

  const login = useCallback(async (loginUsername: string, loginPassword: string): Promise<boolean> => {
    try {
      setAuthLoading(true);
      const response = await authApi.login({ username: loginUsername, password: loginPassword });
      authStorage.saveSession(response.data);
      setUsername(response.data.username);
      setPersonId(response.data.personId);
      setDisplayName(response.data.displayName);
      setRole(response.data.role);
      setIsAuthenticated(true);
      setAuthError(null);
      navigate(APP_ROUTES.HOME);
      return true;
    } catch (err) {
      setAuthError(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
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
      setPersonId(response.data.personId);
      setDisplayName(response.data.displayName);
      setRole(response.data.role);
      setIsAuthenticated(true);
      setAuthError(null);
      navigate(APP_ROUTES.HOME);
      return true;
    } catch (err) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setAuthError(axiosError.response?.data?.error ?? AUTH_ERROR_MESSAGES.REGISTRATION_FAILED);
      logHandledError(err);
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(() => {
    authStorage.clearSession();
    clearPersonDirectoryCache();
    setIsAuthenticated(false);
    setUsername('');
    setPersonId('');
    setDisplayName('');
    setRole(null);
    setAuthError(null);
    navigate(APP_ROUTES.LOGIN);
  }, [navigate]);

  return {
    authError,
    authLoading,
    clearAuthError,
    displayName,
    expireSession,
    isAuthenticated,
    login,
    logout,
    personId,
    register,
    role,
    setAuthDisplayName,
    setAuthPersonId,
    setAuthRole,
    setAuthUsername,
    username,
  };
}
