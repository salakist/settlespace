import { useCallback } from 'react';
import { RegisterRequest } from '../../shared/types';

type UseAppAuthOptions = {
  login: (username: string, password: string) => Promise<boolean>;
  register: (request: RegisterRequest) => Promise<boolean>;
  logout: () => void;
  clearPersonsError: () => void;
  clearPersonsState: () => void;
  clearProfileState: () => void;
};

export function useAppAuth({
  login,
  register,
  logout,
  clearPersonsError,
  clearPersonsState,
  clearProfileState,
}: UseAppAuthOptions) {
  const handleLogin = useCallback(async (username: string, password: string) => {
    const success = await login(username, password);
    if (success) {
      clearPersonsError();
    }
  }, [login, clearPersonsError]);

  const handleRegister = useCallback(async (request: RegisterRequest) => {
    const success = await register(request);
    if (success) {
      clearPersonsError();
    }
  }, [register, clearPersonsError]);

  const handleLogout = useCallback(() => {
    clearPersonsState();
    clearProfileState();
    logout();
  }, [clearPersonsState, clearProfileState, logout]);

  return {
    handleLogin,
    handleLogout,
    handleRegister,
  };
}
