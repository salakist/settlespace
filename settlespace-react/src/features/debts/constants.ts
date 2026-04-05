import { DebtDirection } from '../../shared/types';

export const DEBT_DIRECTION_LABELS: Record<DebtDirection, string> = {
  [DebtDirection.TheyOweYou]: 'They owe you',
  [DebtDirection.YouOweThem]: 'You owe them',
  [DebtDirection.Settled]: 'Settled',
};

export const DEBT_LIST_TEXT = {
  EMPTY_STATE: 'You have no debts right now. New balances will appear here after completed transactions.',
  DETAILS: 'Details',
  SETTLE_NOW: 'Settle now',
  SETTLED: 'Settled',
  ALL_VISIBLE_SETTLED: 'All visible debts are settled.',
} as const;

export const DEBT_SETTLEMENT_TEXT = {
  SETTLEMENT: 'Settlement',
  DESCRIPTION_LABEL: 'Description (optional)',
  CLOSE: 'Close',
  COUNTERPARTY_FALLBACK: 'Counterparty',
  SELECT_DEBT_PROMPT: 'Select a debt to settle.',
  SETTLEMENT_RECORDED: 'Settlement recorded successfully.',
  SETTLEMENT_RECEIVED_PLACEHOLDER: 'Settlement received',
  DEBT_REPAYMENT_PLACEHOLDER: 'Debt repayment',
  RECORD_RECEIVED_PAYMENT: 'Record received payment',
  RECORD_PAYMENT: 'Record payment',
  SAVING: 'Saving...',
  ALREADY_SETTLED: 'This balance is already settled.',
  SETTLEMENT_AMOUNT: 'Settlement amount',
  PERCENT_LABEL: 'Percent (%)',
  BALANCE_HELPER: 'Adjust this balance with a partial or full settlement entry.',
} as const;

export const DEBT_SETTLEMENT_SLIDER_MARKS = [0, 25, 50, 75, 100].map((value) => ({
  value,
  label: `${value}%`,
}));
