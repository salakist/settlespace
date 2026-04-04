import { useCallback } from 'react';
import { RegisterRequest } from '../../shared/types';

type UseAppAuthOptions = {
  login: (username: string, password: string) => Promise<boolean>;
  register: (request: RegisterRequest) => Promise<boolean>;
  logout: () => void;
};

export function useAppAuth({
  login,
  register,
  logout,
}: UseAppAuthOptions) {
  const handleLogin = useCallback(async (username: string, password: string) => {
    await login(username, password);
  }, [login]);

  const handleRegister = useCallback(async (request: RegisterRequest) => {
    await register(request);
  }, [register]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return {
    handleLogin,
    handleLogout,
    handleRegister,
  };
}
