import {
  parseEnumValue,
  Transaction,
} from '../../shared/types';

export enum DebtDirection {
  TheyOweYou = 'TheyOweYou',
  YouOweThem = 'YouOweThem',
  Settled = 'Settled',
}

export function parseDebtDirection(value: string | null | undefined): DebtDirection | null {
  return parseEnumValue(DebtDirection, value);
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
