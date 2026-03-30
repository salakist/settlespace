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

export type TransactionStatus = 'Pending' | 'Completed' | 'Cancelled';

export interface Transaction {
  id?: string;
  payerPersonId: string;
  payeePersonId: string;
  createdByPersonId?: string;
  amount: number;
  currencyCode: string;
  transactionDateUtc: string;
  description: string;
  category?: string;
  status: TransactionStatus;
  createdAtUtc?: string;
  updatedAtUtc?: string;
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