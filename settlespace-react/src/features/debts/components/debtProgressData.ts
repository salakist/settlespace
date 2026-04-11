import { Transaction } from '../../../shared/types';
import { formatDateDDMMYYYY } from '../../../shared/utils/dateFormatting';

const STARTING_POINT_LABEL = 'Start';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function formatAxisDateLabel(value: Date, includeYear: boolean): string {
  const day = String(value.getUTCDate()).padStart(2, '0');
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');

  return includeYear
    ? `${day}/${month}/${value.getUTCFullYear()}`
    : `${day}/${month}`;
}

export type DebtProgressPoint = {
  balance: number;
  delta: number;
  description: string;
  label: string;
  pointType: 'start' | 'transaction';
  timestamp: Date;
};

function toSortableTime(value: string, fallback: number): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toSignedDelta(transaction: Transaction, counterpartyPersonId: string): number {
  return transaction.payerPersonId === counterpartyPersonId
    ? -transaction.amount
    : transaction.amount;
}

export function formatDebtProgressTickLabel(
  value: Date,
  firstTransactionTimestamp: Date,
  lastVisibleTimestamp: Date,
): string {
  if (
    Number.isNaN(value.getTime())
    || Number.isNaN(firstTransactionTimestamp.getTime())
    || Number.isNaN(lastVisibleTimestamp.getTime())
  ) {
    return '';
  }

  const visibleRangeMs = Math.max(lastVisibleTimestamp.getTime() - firstTransactionTimestamp.getTime(), ONE_DAY_MS);
  const startWindowMs = Math.max(ONE_DAY_MS, Math.round(visibleRangeMs * 0.15));
  const shouldShowYear =
    value.getTime() <= firstTransactionTimestamp.getTime() + startWindowMs
    || value.getUTCMonth() === 0;

  return formatAxisDateLabel(value, shouldShowYear);
}

export function buildDebtProgressData(
  transactions: Transaction[],
  counterpartyPersonId: string,
): DebtProgressPoint[] {
  if (transactions.length === 0) {
    return [];
  }

  const sortedTransactions = [...transactions].sort((left, right) => (
    toSortableTime(left.transactionDateUtc, 0) - toSortableTime(right.transactionDateUtc, 0)
  ));

  const firstTimestamp = toSortableTime(sortedTransactions[0].transactionDateUtc, Date.now());
  const lastTimestamp = toSortableTime(sortedTransactions[sortedTransactions.length - 1].transactionDateUtc, firstTimestamp);
  const rangeMs = Math.max(lastTimestamp - firstTimestamp, ONE_DAY_MS);
  const startGapMs = Math.max(ONE_DAY_MS, Math.round(rangeMs * 0.08));
  const points: DebtProgressPoint[] = [
    {
      balance: 0,
      delta: 0,
      description: 'Starting balance',
      label: STARTING_POINT_LABEL,
      pointType: 'start',
      timestamp: new Date(firstTimestamp - startGapMs),
    },
  ];

  let runningBalance = 0;

  sortedTransactions.forEach((transaction, index) => {
    const delta = toSignedDelta(transaction, counterpartyPersonId);
    runningBalance += delta;

    points.push({
      balance: Number(runningBalance.toFixed(2)),
      delta,
      description: transaction.description,
      label: formatDateDDMMYYYY(transaction.transactionDateUtc) || `Transaction ${index + 1}`,
      pointType: 'transaction',
      timestamp: new Date(toSortableTime(transaction.transactionDateUtc, firstTimestamp + index + 1)),
    });
  });

  return points;
}
