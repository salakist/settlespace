import React from 'react';
import { Alert, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { DebtSummary, Person } from '../../../shared/types';

type DebtsListProps = {
  debts: DebtSummary[];
  persons: Person[];
  onSettle: (debt: DebtSummary) => void;
  onViewDetails: (debt: DebtSummary) => void;
};

function formatCurrency(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

function getPersonDisplayName(persons: Person[], personId: string): string {
  const person = persons.find((candidate) => candidate.id === personId);
  return person ? `${person.firstName} ${person.lastName}` : personId;
}

function getDirectionLabel(direction: DebtSummary['direction']): string {
  switch (direction) {
    case 'YouOweThem':
      return 'You owe them';
    case 'TheyOweYou':
      return 'They owe you';
    default:
      return 'Settled';
  }
}

function getDirectionColor(direction: DebtSummary['direction']): 'success' | 'warning' | 'default' {
  switch (direction) {
    case 'TheyOweYou':
      return 'success';
    case 'YouOweThem':
      return 'warning';
    default:
      return 'default';
  }
}

function getSummaryText(debt: DebtSummary, counterpartyName: string, balanceText: string): string {
  switch (debt.direction) {
    case 'TheyOweYou':
      return `${counterpartyName} owes you ${balanceText}.`;
    case 'YouOweThem':
      return `You owe ${counterpartyName} ${balanceText}.`;
    default:
      return `This balance with ${counterpartyName} is settled.`;
  }
}

function getSettlementButtonLabel(direction: DebtSummary['direction']): string {
  if (direction === 'Settled') {
    return 'Settled';
  }

  return 'Settle now';
}

const DebtsList: React.FC<DebtsListProps> = ({ debts, persons, onSettle, onViewDetails }) => {
  if (debts.length === 0) {
    return (
      <Alert severity="info">
        You have no outstanding debts right now. New balances will appear here after completed transactions.
      </Alert>
    );
  }

  const sortedDebts = [...debts].sort((left, right) => right.netAmount - left.netAmount);

  return (
    <Stack spacing={2}>
      {sortedDebts.map((debt) => {
        const counterpartyName = getPersonDisplayName(persons, debt.counterpartyPersonId);
        const balanceText = formatCurrency(debt.netAmount, debt.currencyCode);
        const summaryText = getSummaryText(debt, counterpartyName, balanceText);

        return (
          <Paper
            key={`${debt.counterpartyPersonId}-${debt.currencyCode}`}
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(255,255,255,0.03)',
            }}
          >
            <Stack spacing={1.5}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1.5}
              >
                <div>
                  <Typography variant="h6">{counterpartyName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {summaryText}
                  </Typography>
                </div>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip
                    label={getDirectionLabel(debt.direction)}
                    color={getDirectionColor(debt.direction)}
                    variant={debt.direction === 'Settled' ? 'outlined' : 'filled'}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => onViewDetails(debt)}
                  >
                    Details
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => onSettle(debt)}
                    disabled={debt.direction === 'Settled' || debt.netAmount <= 0}
                  >
                    {getSettlementButtonLabel(debt.direction)}
                  </Button>
                </Stack>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Balance:</strong> {balanceText}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Currency:</strong> {debt.currencyCode}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Transactions:</strong> {debt.transactionCount}
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
};

export default DebtsList;
