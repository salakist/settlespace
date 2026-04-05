import {
  parseEnumValue,
  TransactionStatus,
} from '../../shared/types';

export enum TransactionInvolvement {
  Owned = 'Owned',
  Managed = 'Managed',
}

export function parseTransactionStatus(value: string | null | undefined): TransactionStatus | null {
  return parseEnumValue(TransactionStatus, value);
}

export function parseTransactionInvolvement(
  value: string | null | undefined,
): TransactionInvolvement | null {
  return parseEnumValue(TransactionInvolvement, value);
}

export interface TransactionSearchQuery {
  freeText?: string;
  status?: TransactionStatus[];
  involvement?: TransactionInvolvement;
  category?: string;
  description?: string;
  involved?: string[];
  managedBy?: string[];
  payer?: string;
  payee?: string;
}
