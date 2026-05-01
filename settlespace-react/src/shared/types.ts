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

export function getEnumValues<TEnum extends Record<string, string>>(
  enumType: TEnum,
): Array<TEnum[keyof TEnum]> {
  return Object.values(enumType) as Array<TEnum[keyof TEnum]>;
}

export function parseEnumValue<TEnum extends Record<string, string>>(
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
  confirmedByPersonIds?: string[];
  createdAtUtc?: string;
  updatedAtUtc?: string;
}
