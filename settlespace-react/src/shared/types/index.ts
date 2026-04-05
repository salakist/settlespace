export enum PersonRole {
  Admin = 'ADMIN',
  Manager = 'MANAGER',
  User = 'USER',
}

export enum TransactionStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum TransactionInvolvement {
  Owned = 'Owned',
  Managed = 'Managed',
}

export enum DebtDirection {
  TheyOweYou = 'TheyOweYou',
  YouOweThem = 'YouOweThem',
  Settled = 'Settled',
}

export function getEnumValues<TEnum extends Record<string, string>>(
  enumType: TEnum,
): Array<TEnum[keyof TEnum]> {
  return Object.values(enumType) as Array<TEnum[keyof TEnum]>;
}

function parseEnumValue<TEnum extends Record<string, string>>(
  enumType: TEnum,
  value: string | null | undefined,
): TEnum[keyof TEnum] | null {
  if (!value) {
    return null;
  }

  const allowedValues = getEnumValues(enumType) as string[];
  return allowedValues.includes(value) ? (value as TEnum[keyof TEnum]) : null;
}

export function parsePersonRole(value: string | null | undefined): PersonRole | null {
  return parseEnumValue(PersonRole, value);
}

export function parseTransactionStatus(value: string | null | undefined): TransactionStatus | null {
  return parseEnumValue(TransactionStatus, value);
}

export function parseTransactionInvolvement(
  value: string | null | undefined,
): TransactionInvolvement | null {
  return parseEnumValue(TransactionInvolvement, value);
}

export function parseDebtDirection(value: string | null | undefined): DebtDirection | null {
  return parseEnumValue(DebtDirection, value);
}

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
  displayName?: string;
  username?: string;
  role?: PersonRole;
  phoneNumber?: string;
  email?: string;
  dateOfBirth?: string;
  addresses?: Address[];
}

export interface Transaction {
  id?: string;
  payerPersonId: string;
  payerDisplayName?: string;
  payeePersonId: string;
  payeeDisplayName?: string;
  createdByPersonId?: string;
  createdByDisplayName?: string;
  amount: number;
  currencyCode: string;
  transactionDateUtc: string;
  description: string;
  category?: string;
  status: TransactionStatus;
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

export interface DebtSummary {
  counterpartyPersonId: string;
  counterpartyDisplayName?: string;
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
  counterpartyDisplayName?: string;
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
  personId: string;
  displayName: string;
  role: PersonRole;
  expiresAtUtc: string;
}