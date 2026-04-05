import { apiClient } from '../../shared/api/client';
import {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from './types';

export const authApi = {
  login: (request: LoginRequest) => apiClient.post<LoginResponse>('/auth/login', request),
  register: (request: RegisterRequest) => apiClient.post<LoginResponse>('/auth/register', request),
  changePassword: (request: ChangePasswordRequest) => apiClient.post('/auth/change-password', request),
};
