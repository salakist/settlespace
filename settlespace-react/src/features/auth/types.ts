import { Address, PersonRole } from '../../shared/types';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber?: string;
  email?: string;
  dateOfBirth?: string;
  addresses?: Address[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  personId: string;
  displayName: string;
  role: PersonRole;
  expiresAtUtc: string;
}
