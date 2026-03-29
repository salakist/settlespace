export interface Person {
  id?: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  expiresAtUtc: string;
}