export interface Address {
  label: string;
  streetLine1: string;
  streetLine2?: string;
  postalCode: string;
  city: string;
  stateOrRegion?: string;
  country: string;
}

export interface Person {
  id?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  dateOfBirth?: string;
  addresses?: Address[];
}

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
  expiresAtUtc: string;
}