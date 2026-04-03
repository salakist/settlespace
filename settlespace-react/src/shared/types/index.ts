export type PersonRole = 'ADMIN' | 'USER' | 'MANAGER';

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
  role?: PersonRole;
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

export type DebtDirection = 'TheyOweYou' | 'YouOweThem' | 'Settled';

export interface DebtSummary {
  counterpartyPersonId: string;
  currencyCode: string;
  netAmount: number;
  direction: DebtDirection;
  transactionCount: number;
}

export interface DebtDetails extends DebtSummary {
  paidByCurrentPerson: number;
  paidByCounterparty: number;
  transactions: Transaction[];
}

export interface DebtSettlementResult {
  settlementTransactionId?: string;
  counterpartyPersonId: string;
  currencyCode: string;
  settledAmount: number;
  remainingNetAmount: number;
  direction: DebtDirection;
}

export interface SettleDebtRequest {
  counterpartyPersonId: string;
  amount: number;
  currencyCode: string;
  description?: string;
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
  role: PersonRole;
  expiresAtUtc: string;
}