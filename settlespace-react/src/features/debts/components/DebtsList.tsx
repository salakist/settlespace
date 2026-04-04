import React, { useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Alert, Chip, IconButton, Menu, MenuItem, Paper, Stack, Typography } from '@mui/material';
import { DebtSummary, Person } from '../../../shared/types';
import { panelSurfaceSx } from '../../../shared/theme/surfaceStyles';

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

function getTransactionCountLabel(count: number): string {
  return count === 1 ? '1 transaction' : `${count} transactions`;
}

function getSettlementButtonLabel(direction: DebtSummary['direction']): string {
  if (direction === 'Settled') {
    return 'Settled';
  }

  return 'Settle now';
}

const DebtsList: React.FC<DebtsListProps> = ({ debts, persons, onSettle, onViewDetails }) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [activeDebt, setActiveDebt] = useState<DebtSummary | null>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, debt: DebtSummary) => {
    setMenuAnchor(event.currentTarget);
    setActiveDebt(debt);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setActiveDebt(null);
  };

  const handleViewDetailsAction = () => {
    if (activeDebt) {
      onViewDetails(activeDebt);
    }

    handleCloseMenu();
  };

  const handleSettleAction = () => {
    if (activeDebt && activeDebt.direction !== 'Settled' && activeDebt.netAmount > 0) {
      onSettle(activeDebt);
    }

    handleCloseMenu();
  };

  if (debts.length === 0) {
    return (
      <Alert severity="info">
        You have no outstanding debts right now. New balances will appear here after completed transactions.
      </Alert>
    );
  }

  const sortedDebts = [...debts].sort((left, right) => right.netAmount - left.netAmount);

  return (
    <>
      <Stack spacing={2}>
        {sortedDebts.map((debt) => {
        const counterpartyName = getPersonDisplayName(persons, debt.counterpartyPersonId);
        const balanceText = formatCurrency(debt.netAmount, debt.currencyCode);
        const transactionCountLabel = getTransactionCountLabel(debt.transactionCount);

        return (
          <Paper
            key={`${debt.counterpartyPersonId}-${debt.currencyCode}`}
            elevation={0}
            sx={panelSurfaceSx}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={1.25}
              useFlexGap
            >
              <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                  <Typography variant="h6">{counterpartyName}</Typography>
                  <Chip
                    label={getDirectionLabel(debt.direction)}
                    color={getDirectionColor(debt.direction)}
                    variant={debt.direction === 'Settled' ? 'outlined' : 'filled'}
                  />
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  {balanceText} • {debt.currencyCode} • {transactionCountLabel}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ alignSelf: { xs: 'stretch', md: 'center' } }}>
                <IconButton
                  aria-label={`Open actions for ${counterpartyName}`}
                  onClick={(event) => handleOpenMenu(event, debt)}
                  sx={{ ml: { md: 'auto' } }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Stack>
            </Stack>
          </Paper>
        );
        })}
      </Stack>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleCloseMenu}>
        <MenuItem onClick={handleViewDetailsAction}>Details</MenuItem>
        <MenuItem
          onClick={handleSettleAction}
          disabled={!activeDebt || activeDebt.direction === 'Settled' || activeDebt.netAmount <= 0}
        >
          {activeDebt ? getSettlementButtonLabel(activeDebt.direction) : 'Settle now'}
        </MenuItem>
      </Menu>
    </>
  );
};

export default DebtsList;
